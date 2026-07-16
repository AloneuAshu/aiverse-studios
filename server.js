const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/shorts', express.static(path.join(__dirname, 'shorts')));

const SHORTS_DIR = path.join(__dirname, 'shorts');
const TEMP_DIR   = path.join(__dirname, 'temp');
const PUBLIC_DIR = path.join(__dirname, 'public');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

[SHORTS_DIR, TEMP_DIR, PUBLIC_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const activeBatches = {};
const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`[${cmd}] code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

function runFFmpegProgress(args, totalDuration, onProgress) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', d => {
      const t = d.toString();
      stderr += t;
      const m = t.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (m) {
        const secs = +m[1]*3600 + +m[2]*60 + +m[3];
        onProgress(Math.min(99, Math.round((secs / totalDuration) * 100)));
      }
    });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-800)}`));
    });
  });
}

async function probeFile(filePath) {
  const out = await runCommand('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-show_entries', 'stream=codec_type,width,height,r_frame_rate',
    '-of', 'json',
    filePath
  ]);
  return JSON.parse(out);
}

// Encode a template clip with automatic silent-audio injection when source has no audio.
// This ensures every segment has identical stream layouts (h264 + aac) for reliable concat.
async function encodeTemplateClip({ src, startSec, durationSec, outPath, aspectRatio, fitMode, overlayText, volume, panX = 0, fps = 30 }, onProgress) {
  // Probe the template file to check for audio
  const probe   = await probeFile(src);
  const hasAudio = probe.streams.some(s => s.codec_type === 'audio');
  const vf       = buildVideoFilter(aspectRatio, fitMode, overlayText, panX);

  let args;
  if (hasAudio) {
    // Template has audio — encode normally
    args = [
      '-ss', String(startSec), '-t', String(durationSec),
      '-i',  src,
      '-vf', vf,
      '-r', String(fps), '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264', '-preset', 'superfast', '-crf', '22',
      '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '128k',
      '-af', `volume=${volume}`,
      '-y', outPath
    ];
  } else {
    // Template has NO audio — inject silent audio via lavfi anullsrc
    args = [
      '-ss', String(startSec), '-t', String(durationSec),
      '-i',  src,
      '-f', 'lavfi', '-t', String(durationSec),
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-map', '0:v:0',   // video from the template file
      '-map', '1:a:0',   // audio from the silent generator
      '-vf', vf,
      '-r', String(fps), '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264', '-preset', 'superfast', '-crf', '22',
      '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '128k',
      '-shortest',
      '-y', outPath
    ];
  }

  console.log(`[TPL] Encoding template clip: ${path.basename(src)} | hasAudio=${hasAudio} | ${startSec}s → +${durationSec}s → ${aspectRatio}`);
  await runFFmpegProgress(args, durationSec, onProgress);
}

// Build the vf filter string for a given target aspect ratio + fit mode, allowing horizontal pan (panX) for centering subjects
function buildVideoFilter(aspectRatio, fitMode, overlayText, panX = 0) {
  const textPart = overlayText
    ? `,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${overlayText.replace(/'/g, "'\\''")}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h-280:box=1:boxcolor=0x000000@0.6:boxborderw=15`
    : '';

  const filters = {
    vertical: {
      blur: `split[v1][v2];[v1]scale=1080:1920,boxblur=20:10[bg];[v2]scale=w='if(gt(iw/ih,9/16),1080,-2)':h='if(gt(iw/ih,9/16),-2,1920)'[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2${textPart}`,
      crop: `crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-ow)/2+(${panX})*(iw-ow)/2',scale=1080:1920${textPart}`,
      pad:  `scale=w='if(gt(iw/ih,9/16),1080,-2)':h='if(gt(iw/ih,9/16),-2,1920)',pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black${textPart}`
    },
    square: {
      blur: `split[v1][v2];[v1]scale=1080:1080,boxblur=20:10[bg];[v2]scale=w='if(gt(iw/ih,1),1080,-2)':h='if(gt(iw/ih,1),-2,1080)'[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2${textPart}`,
      crop: `crop='min(iw,ih)':'min(ih,iw)':'(iw-ow)/2+(${panX})*(iw-ow)/2',scale=1080:1080${textPart}`,
      pad:  `scale=w='if(gt(iw/ih,1),1080,-2)':h='if(gt(iw/ih,1),-2,1080)',pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black${textPart}`
    },
    landscape: {
      blur: `split[v1][v2];[v1]scale=1920:1080,boxblur=20:10[bg];[v2]scale=w='if(gt(iw/ih,16/9),1920,-2)':h='if(gt(iw/ih,16/9),-2,1080)'[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2${textPart}`,
      crop: `crop='min(iw,ih*16/9)':'min(ih,iw*9/16)':'(iw-ow)/2+(${panX})*(iw-ow)/2',scale=1920:1080${textPart}`,
      pad:  `scale=w='if(gt(iw/ih,16/9),1920,-2)':h='if(gt(iw/ih,16/9),-2,1080)',pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black${textPart}`
    },
    original: {
      blur: `scale='trunc(iw/2)*2':'trunc(ih/2)*2'${textPart}`,
      crop: `scale='trunc(iw/2)*2':'trunc(ih/2)*2'${textPart}`,
      pad:  `scale='trunc(iw/2)*2':'trunc(ih/2)*2'${textPart}`
    }
  };

  return (filters[aspectRatio] || filters.vertical)[fitMode] || filters.vertical.blur;
}

// Encode a single clip from source into a normalised .mp4 segment
async function encodeClip({ src, startSec, durationSec, outPath, aspectRatio, fitMode, overlayText, volume, panX = 0, fps = 30 }, onProgress) {
  const vf = buildVideoFilter(aspectRatio, fitMode, overlayText, panX);
  const args = [
    '-ss', String(startSec),
    '-t',  String(durationSec),
    '-i',  src,
    '-map', '0:v:0',
    '-map', '0:a:0',
    '-vf', vf,
    '-r',  String(fps),
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-preset', 'superfast',
    '-crf', '22',
    '-c:a', 'aac',
    '-ac', '2',
    '-ar', '44100',
    '-b:a', '128k',
    '-af', `volume=${volume}`,
    '-y',
    outPath
  ];
  await runFFmpegProgress(args, durationSec, onProgress || (() => {}));
}

// Clips timing calculator
function calculateClips(videoDuration, numClips, vibe, targetTotal) {
  const clips = [];

  if (vibe === 'cinematic' || vibe === 'fast-cut') {
    const clipDur = targetTotal / numClips;
    const segLen  = videoDuration / numClips;
    for (let i = 0; i < numClips; i++) {
      const ss = i * segLen;
      const es = (i + 1) * segLen;
      const maxS = Math.max(ss, es - clipDur);
      const start = ss + Math.random() * (maxS - ss);
      clips.push({ start: Math.max(0, parseFloat(start.toFixed(2))), duration: parseFloat(clipDur.toFixed(2)) });
    }
  } else {
    // true random – varying lengths
    let rem = targetTotal;
    const minD = 2, maxD = Math.max(3, targetTotal / 2);
    const durs = [];
    for (let i = 0; i < numClips - 1; i++) {
      const limit = rem - (numClips - 1 - i) * minD;
      const d = limit <= minD ? minD : minD + Math.random() * (Math.min(maxD, limit) - minD);
      durs.push(parseFloat(d.toFixed(2)));
      rem -= d;
    }
    durs.push(parseFloat(rem.toFixed(2)));

    const segLen = videoDuration / numClips;
    for (let i = 0; i < numClips; i++) {
      const d = durs[i];
      const ss = i * segLen;
      const es = (i + 1) * segLen;
      const maxS = Math.max(ss, es - d);
      const start = ss + Math.random() * (maxS - ss);
      clips.push({ start: Math.max(0, parseFloat(start.toFixed(2))), duration: d });
    }
  }
  return clips;
}

// Generate S non-overlapping clips of 5 seconds each
function generateNonOverlappingClips(videoDuration, numClips, clipDuration = 5) {
  const clips = [];
  const totalDurationNeeded = numClips * clipDuration;
  
  if (videoDuration >= totalDurationNeeded) {
    const chunkLen = videoDuration / numClips;
    for (let i = 0; i < numClips; i++) {
      const minStart = i * chunkLen;
      const maxStart = (i + 1) * chunkLen - clipDuration;
      const start = minStart + Math.random() * (maxStart - minStart);
      clips.push({ start: parseFloat(start.toFixed(2)), duration: clipDuration, panX: 0 });
    }
  } else {
    // video too short, allow overlap
    for (let i = 0; i < numClips; i++) {
      const start = Math.random() * Math.max(0, videoDuration - clipDuration);
      clips.push({ start: parseFloat(start.toFixed(2)), duration: clipDuration, panX: 0 });
    }
  }
  return clips;
}


// -----------------------------------------------------------------------------
// API: NATIVE FILE BROWSE
// -----------------------------------------------------------------------------

let isBrowsing = false;
app.post('/api/browse', (req, res) => {
  if (isBrowsing) {
    return res.status(409).json({ error: 'A file dialog is already open. Please close it first.' });
  }
  isBrowsing = true;
  console.log('[BROWSE] Opening file dialog...');
  const scriptPath = path.join(__dirname, 'browse.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });
  ps.on('close', code => {
    isBrowsing = false;
    console.log(`[BROWSE] PowerShell closed with code ${code}`);
    if (code === 0) {
      console.log(`[BROWSE] Selected: ${stdout.trim()}`);
      res.json({ success: true, filePath: stdout.trim() });
    } else {
      console.error(`[BROWSE] Error details: ${stderr}`);
      res.status(500).json({ error: `Browse failed: ${stderr}` });
    }
  });
  ps.on('error', err => {
    isBrowsing = false;
    console.error('[BROWSE] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open file dialog' });
  });
});

// -----------------------------------------------------------------------------
// API: NATIVE FOLDER BROWSE (for template folder)
// -----------------------------------------------------------------------------

let isBrowsingFolder = false;
app.post('/api/browse-folder', (req, res) => {
  if (isBrowsingFolder) {
    return res.status(409).json({ error: 'A folder dialog is already open. Please close it first.' });
  }
  isBrowsingFolder = true;
  console.log('[BROWSE-FOLDER] Opening folder dialog...');
  const scriptPath = path.join(__dirname, 'browse-folder.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });
  ps.on('close', code => {
    isBrowsingFolder = false;
    console.log(`[BROWSE-FOLDER] PowerShell closed with code ${code}`);
    if (code === 0) {
      console.log(`[BROWSE-FOLDER] Selected: ${stdout.trim()}`);
      res.json({ success: true, folderPath: stdout.trim() });
    } else {
      console.error(`[BROWSE-FOLDER] Error details: ${stderr}`);
      res.status(500).json({ error: `Folder browse failed: ${stderr}` });
    }
  });
  ps.on('error', err => {
    isBrowsingFolder = false;
    console.error('[BROWSE-FOLDER] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open folder dialog' });
  });
});

// -----------------------------------------------------------------------------
// API: SCAN TEMPLATE FOLDER
// Returns info about Video1 (mid clip) and TitleCard (end clip)
// Auto-detects: first video = mid, second video (or file with "title"/"card") = end
// -----------------------------------------------------------------------------

app.post('/api/scan-template', async (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'folderPath required' });

  const absFolder = path.resolve(folderPath);
  if (!fs.existsSync(absFolder)) return res.status(404).json({ error: `Folder not found: ${folderPath}` });

  try {
    const files = fs.readdirSync(absFolder)
      .filter(f => VIDEO_EXTS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(absFolder, f));

    if (files.length < 2) return res.status(400).json({ error: 'Template folder must contain at least 2 video files (Video1 + TitleCard).' });

    // Smart sort: title card is the one whose name contains "title" or "card",
    // otherwise fall back to alphabetical order (first = mid, second = end)
    const lowerNames = files.map(f => path.basename(f).toLowerCase());
    let midFile, endFile;

    const titleIdx = lowerNames.findIndex(n => n.includes('title') || n.includes('card'));
    if (titleIdx !== -1) {
      endFile = files[titleIdx];
      midFile = files.find((f, i) => i !== titleIdx) || files[0];
    } else {
      midFile = files[0];
      endFile = files[1];
    }

    // Probe both
    const [midProbe, endProbe] = await Promise.all([probeFile(midFile), probeFile(endFile)]);
    const midDur = parseFloat(midProbe.format.duration);
    const endDur = parseFloat(endProbe.format.duration);

    res.json({
      success: true,
      midClip: { filePath: midFile, fileName: path.basename(midFile), duration: parseFloat(midDur.toFixed(2)) },
      endClip: { filePath: endFile, fileName: path.basename(endFile), duration: parseFloat(endDur.toFixed(2)) },
    });
  } catch (err) {
    console.error('Template scan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// API: SERVE LOCAL VIDEO FILE (for manual cutter mini player)
// -----------------------------------------------------------------------------

app.get('/api/serve-video', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  const absPath = path.resolve(decodeURIComponent(filePath));
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'File not found' });

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();
  const mimeMap = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo' };
  const mimeType = mimeMap[ext] || 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(absPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType
    });
    file.pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': mimeType, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(absPath).pipe(res);
  }
});

// -----------------------------------------------------------------------------
// API: PROBE SOURCE FILE
// -----------------------------------------------------------------------------

app.post('/api/probe', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  try {
    const stats = fs.statSync(absPath);
    const sizeGB = (stats.size / (1024 ** 3)).toFixed(2);
    const probe  = await probeFile(absPath);

    const duration    = parseFloat(probe.format.duration);
    const videoStream = probe.streams.find(s => s.codec_type === 'video');
    const audioStream = probe.streams.find(s => s.codec_type === 'audio');
    const hasVideo    = !!videoStream;
    const hasAudio    = !!audioStream;

    let width = 0, height = 0, fps = 'N/A';
    if (hasVideo) {
      width  = videoStream.width;
      height = videoStream.height;
      const [n, d] = (videoStream.r_frame_rate || '0/1').split('/');
      if (+d !== 0) fps = Math.round(+n / +d);
    }

    // Thumbnail at ~10% of duration
    let thumbnailUrl = null;
    if (hasVideo && duration > 0) {
      const thumbName = `input_${Date.now()}.jpg`;
      const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
      await runCommand('ffmpeg', ['-ss', String((duration * 0.1).toFixed(2)), '-i', absPath, '-vframes', '1', '-q:v', '2', thumbPath, '-y']);
      thumbnailUrl = `/thumbnails/${thumbName}`;
    }

    res.json({ success: true, fileName: path.basename(absPath), sizeGB, duration: parseFloat(duration.toFixed(2)), hasVideo, hasAudio, width, height, fps, thumbnailUrl });
  } catch (err) {
    console.error('Probe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// API: GENERATE BATCH
// -----------------------------------------------------------------------------

app.post('/api/generate', async (req, res) => {
  const {
    filePath,
    shortCount   = 1,
    totalDuration = 30,        // target final short duration
    vibe         = 'cinematic',
    aspectRatio  = 'vertical',
    fitMode      = 'blur',
    overlayText  = '',
    volume       = 1.0,
    timelineClips = null,
    mode         = 'automatic', // "automatic" or "manual"
    clips        = null,        // manual mode clips: [{ start, duration, panX }]
    fadeDuration  = 0.5,        // seconds for black fade between clips (0 = hard cut)
    // Template fields
    useTemplate   = false,
    templateMidFile = null,    // Video1 – last N seconds inserted in middle
    templateEndFile = null,    // TitleCard – last N seconds inserted at end
    templateMidDuration = 3,   // how many seconds to take from Video1
    templateEndDuration = 3,   // how many seconds to take from TitleCard
  } = req.body;

  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  try {
    const probe      = await probeFile(absPath);
    const srcDur     = parseFloat(probe.format.duration);
    const hasVideo   = probe.streams.some(s => s.codec_type === 'video');

    // Validate template files if used
    if (useTemplate) {
      if (!templateMidFile || !fs.existsSync(templateMidFile))
        return res.status(400).json({ error: 'Template mid-clip file not found.' });
      if (!templateEndFile || !fs.existsSync(templateEndFile))
        return res.status(400).json({ error: 'Template end-clip file not found.' });
    }

    const batchId = `batch_${Date.now()}`;
    activeBatches[batchId] = {
      batchId, status: 'processing',
      shortCount: +shortCount,
      jobs: Array.from({ length: +shortCount }, (_, j) => ({
        jobId: `${batchId}_job_${j}`, index: j,
        status: 'queued', progress: 0,
        error: null, outputFileName: null, outputPath: null, thumbnailPath: null
      }))
    };

    processBatch(batchId, absPath, srcDur, hasVideo, {
      shortCount: +shortCount, totalDuration: +totalDuration, vibe,
      aspectRatio, fitMode, overlayText, volume: +volume, timelineClips,
      mode, clips,
      fadeDuration: parseFloat(fadeDuration) || 0,
      useTemplate, templateMidFile, templateEndFile,
      templateMidDuration: +templateMidDuration,
      templateEndDuration: +templateEndDuration
    });

    res.json({ success: true, batchId });
  } catch (err) {
    console.error('Generate launch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// CINEMATIC FADE STITCHER
// Stitches N pre-encoded clips with black-fade video + exponential audio fade.
//
// Strategy: per-clip fade/afade filters → single concat filter → one FFmpeg pass
//
// For each clip i with actual duration D[i] and fade duration F:
//   Video : fade=t=in:st=0:d=F  +  fade=t=out:st=(D[i]-F):d=F:color=black
//   Audio : afade=t=in:st=0:d=F:curve=exp  +  afade=t=out:st=(D[i]-F):d=F:curve=exp
//
// First clip has no fade-in; last clip has no fade-out.
// Falls back to simple concat when fadeDuration === 0 (hard cut mode).
// -----------------------------------------------------------------------------

async function stitchWithFades(clipPaths, outPath, fadeDuration = 0.5, job = null) {
  const n   = clipPaths.length;
  const F   = Math.max(0, parseFloat(fadeDuration) || 0);

  // -- Fast-path: hard cuts (F=0) ------------------------------------------
  if (F === 0) {
    const tmpList = outPath + '_list.txt';
    fs.writeFileSync(tmpList,
      clipPaths.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "\\'")}'`).join('\n'),
      'utf8');
    await runCommand('ffmpeg', ['-f','concat','-safe','0','-i',tmpList,'-c','copy','-y',outPath]);
    try { fs.unlinkSync(tmpList); } catch (_) {}
    return;
  }

  // -- Probe each clip's exact duration ------------------------------------
  const durations = await Promise.all(clipPaths.map(async p => {
    const info = await probeFile(p);
    return parseFloat(info.format.duration) || 5;
  }));

  // -- Build filter_complex -------------------------------------------------
  // Each clip gets: video fade-to-black, audio exponential fade
  // Then all processed streams are fed into a single concat filter.

  const inputArgs = [];
  clipPaths.forEach(p => { inputArgs.push('-i', p); });

  const filterParts  = [];
  const videoLabels  = [];
  const audioLabels  = [];

  for (let i = 0; i < n; i++) {
    const D  = durations[i];
    // Clamp fade so it never exceeds half the clip duration
    const f  = Math.min(F, D * 0.45);
    const vo = `[fv${i}]`;
    const ao = `[fa${i}]`;

    const isFirst = i === 0;
    const isLast  = i === n - 1;

    // --- Video fade chain ---
    let vChain = `[${i}:v]`;
    if (!isFirst) {
      vChain += `fade=t=in:st=0:d=${f.toFixed(3)}:color=black,`;
    }
    if (!isLast) {
      vChain += `fade=t=out:st=${(D - f).toFixed(3)}:d=${f.toFixed(3)}:color=black`;
    }
    // Strip trailing comma if only one filter or both skipped
    vChain = vChain.replace(/,$/, '');
    if (vChain === `[${i}:v]`) {
      // No filter needed — just pass through using copy
      vChain += `copy`;
    }
    filterParts.push(`${vChain}${vo}`);

    // --- Audio fade chain (exponential curve = cinema mix) ---
    let aChain = `[${i}:a]`;
    if (!isFirst) {
      aChain += `afade=t=in:st=0:d=${f.toFixed(3)}:curve=exp,`;
    }
    if (!isLast) {
      aChain += `afade=t=out:st=${(D - f).toFixed(3)}:d=${f.toFixed(3)}:curve=exp`;
    }
    aChain = aChain.replace(/,$/, '');
    if (aChain === `[${i}:a]`) {
      aChain += `acopy`;
    }
    filterParts.push(`${aChain}${ao}`);

    videoLabels.push(vo);
    audioLabels.push(ao);
  }

  // Concat step
  const concatInputs = videoLabels.map((v, i) => `${v}${audioLabels[i]}`).join('');
  filterParts.push(`${concatInputs}concat=n=${n}:v=1:a=1[vout][aout]`);

  const filterComplex = filterParts.join(';');

  if (job) job.status = `Rendering ${n} clips with ${(F*1000).toFixed(0)}ms black-fade transitions...`;

  const totalDur = durations.reduce((s, d) => s + d, 0);

  await runFFmpegProgress([
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
    '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '160k',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y', outPath
  ], totalDur, pct => {
    if (job) job.progress = 82 + Math.round((pct / 100) * 8);
  });
}

// -----------------------------------------------------------------------------
// BATCH PROCESSOR
// -----------------------------------------------------------------------------

async function processBatch(batchId, srcPath, srcDur, hasVideo, cfg) {
  const batch = activeBatches[batchId];
  if (!batch) return;

  const {
    shortCount, totalDuration, vibe, aspectRatio, fitMode, overlayText, volume,
    mode, clips: manualClips, fadeDuration = 0.5,
    useTemplate, templateMidFile, templateEndFile,
    templateMidDuration, templateEndDuration
  } = cfg;

  // Pre-generate all random clips for the entire batch if automatic mode
  let flatClips = [];
  if (mode === 'automatic') {
    flatClips = generateNonOverlappingClips(srcDur, shortCount * 4, 5);
  }

  for (let j = 0; j < batch.jobs.length; j++) {
    const job = batch.jobs[j];
    job.status = 'processing';
    job.progress = 5;

    try {
      const jobTempDir = path.join(TEMP_DIR, job.jobId);
      if (!fs.existsSync(jobTempDir)) fs.mkdirSync(jobTempDir, { recursive: true });

      // Generate unique name for this job
      const jobTs = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      // Add a slight delay to ensure timestamp updates if loops are fast
      await new Promise(r => setTimeout(r, 100));
      const finalName = `short_${jobTs}_${j + 1}.mp4`;
      const finalPath = path.join(SHORTS_DIR, finalName);

      // Create cuts directory
      const cutsDirName = `short_${jobTs}_${j + 1}_cuts`;
      const cutsDir = path.join(SHORTS_DIR, cutsDirName);
      if (!fs.existsSync(cutsDir)) fs.mkdirSync(cutsDir, { recursive: true });

      // -- 1. Determine clips for this job ------------------------------------
      let clips;
      if (mode === 'manual') {
        if (j === 0 && manualClips && manualClips.length > 0) {
          clips = manualClips;
        } else {
          // Fallback or secondary jobs in manual mode
          clips = generateNonOverlappingClips(srcDur, 4, 5);
        }
      } else {
        // Automatic mode: slice 4 clips from pre-generated flatClips
        clips = flatClips.slice(j * 4, (j + 1) * 4);
      }

      job.status = `Encoding ${clips.length} cuts to ${cutsDirName}/...`;
      job.progress = 8;

      // -- 2. Encode all clips and save to cuts subfolder ---------------------
      const encodedClips = []; // { path, duration }

      for (let c = 0; c < clips.length; c++) {
        const clip    = clips[c];
        const outPath = path.join(cutsDir, `cut_${c + 1}.mp4`);
        job.status = `Encoding cut ${c + 1}/${clips.length} to ${cutsDirName}/`;

        const startPct = 8  + Math.round((c / clips.length) * 55);
        const endPct   = 8  + Math.round(((c + 1) / clips.length) * 55);

        const panX = clip.panX !== undefined ? parseFloat(clip.panX) : 0;

        await encodeClip({
          src: srcPath,
          startSec: clip.start,
          durationSec: clip.duration || 5,
          outPath,
          aspectRatio,
          fitMode,
          overlayText: '',
          volume,
          panX,
        }, pct => {
          job.progress = startPct + Math.round((pct / 100) * (endPct - startPct));
        });

        encodedClips.push({ path: outPath, duration: clip.duration || 5 });
      }

      // -- 3. Encode template clips (with auto-silent-audio injection) --------
      let midClipPath = null, endClipPath = null;

      if (useTemplate) {
        // -- 3a. Mid clip: last N seconds of templateMidFile
        job.status = 'Encoding template mid-clip (16:9 → 9:16)...';
        job.progress = 65;

        const midProbe  = await probeFile(templateMidFile);
        const midSrcDur = parseFloat(midProbe.format.duration);
        const midStart  = Math.max(0, midSrcDur - templateMidDuration);
        midClipPath     = path.join(jobTempDir, 'tpl_mid.mp4');

        await encodeTemplateClip({
          src: templateMidFile,
          startSec: parseFloat(midStart.toFixed(2)),
          durationSec: templateMidDuration,
          outPath: midClipPath,
          aspectRatio, fitMode,
          overlayText: '',
          volume,
        }, pct => { job.progress = 65 + Math.round((pct / 100) * 7); });

        // -- 3b. End / TitleCard clip: last N seconds of templateEndFile
        job.status = 'Encoding template title-card (16:9 → 9:16)...';
        job.progress = 73;

        const endProbe  = await probeFile(templateEndFile);
        const endSrcDur = parseFloat(endProbe.format.duration);
        const endStart  = Math.max(0, endSrcDur - templateEndDuration);
        endClipPath     = path.join(jobTempDir, 'tpl_end.mp4');

        await encodeTemplateClip({
          src: templateEndFile,
          startSec: parseFloat(endStart.toFixed(2)),
          durationSec: templateEndDuration,
          outPath: endClipPath,
          aspectRatio, fitMode,
          overlayText,  // overlay text goes on title card
          volume,
        }, pct => { job.progress = 73 + Math.round((pct / 100) * 7); });
      }

      // -- 4. Build final ordered concat list -------------------------------
      // Structure: [first half random] → [mid template] → [second half random] → [end template]
      let orderedPaths = [];

      if (useTemplate && midClipPath && endClipPath) {
        const half    = Math.ceil(encodedClips.length / 2);
        const firstH  = encodedClips.slice(0, half).map(c => c.path);
        const secondH = encodedClips.slice(half).map(c => c.path);
        orderedPaths  = [...firstH, midClipPath, ...secondH, endClipPath];
      } else {
        orderedPaths = encodedClips.map(c => c.path);
      }

      // -- 5. Stitch with cinematic black-fade transitions -------------------
      job.status = 'Stitching with cinematic transitions...';
      job.progress = 82;

      await stitchWithFades(orderedPaths, finalPath, fadeDuration, job);

      // -- 6. Thumbnail -------------------------------------------------------
      job.status = 'Generating thumbnail...';
      job.progress = 92;

      const thumbName = `thumb_${path.basename(finalName, '.mp4')}.jpg`;
      const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
      await runCommand('ffmpeg', ['-ss', '0.5', '-i', finalPath, '-vframes', '1', '-q:v', '2', thumbPath, '-y']);

      // -- 7. Cleanup ---------------------------------------------------------
      try { fs.rmSync(jobTempDir, { recursive: true, force: true }); } catch (_) {}

      job.status = 'completed';
      job.progress = 100;
      job.outputFileName = finalName;
      job.outputPath     = `/shorts/${finalName}`;
      job.thumbnailPath  = `/thumbnails/${thumbName}`;

    } catch (err) {
      console.error(`Job ${job.jobId} error:`, err);
      job.status  = 'failed';
      job.error   = err.message;
      job.progress = 100;
    }
  }

  const allOk = batch.jobs.every(j => j.status === 'completed');
  batch.status = allOk ? 'completed' : 'failed';
}

// -----------------------------------------------------------------------------
// API: POLL STATUS
// -----------------------------------------------------------------------------

app.get('/api/status/:batchId', (req, res) => {
  const batch = activeBatches[req.params.batchId];
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json(batch);
});

// API: LIST SHORTS LIBRARY
app.get('/api/list-shorts', (req, res) => {
  const subfolders = ['5s', '8s', '10s', '15s'];
  const results = [];

  subfolders.forEach(folderName => {
    const folderPath = path.join(SHORTS_DIR, folderName);
    if (fs.existsSync(folderPath)) {
      try {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file.endsWith('.mp4') || file.endsWith('.webm')) {
            const fullPath = path.join(folderPath, file);
            const stats = fs.statSync(fullPath);
            results.push({
              folder: folderName,
              fileName: file,
              url: `/shorts/${folderName}/${file}`,
              size: stats.size,
              createdAt: stats.mtime
            });
          }
        });
      } catch (err) {
        console.error(`[LIST-SHORTS] Error reading folder ${folderName}:`, err);
      }
    }
  });

  // Sort by createdAt descending (newest first)
  results.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ success: true, shorts: results });
});

// API: SUBTITLE GENERATOR
app.post('/api/subtitle-generate', (req, res) => {
  const { filePath, langCode = 'en-US', detectGender = false } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'File not found' });

  const uniqueId = `sub_${Date.now()}`;
  const srtName = `subs_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.srt`;
  const srtPath = path.join(SHORTS_DIR, srtName);

  activeBatches[uniqueId] = {
    batchId: uniqueId,
    status: 'transcribing',
    progress: 0,
    srtPath: `/shorts/${srtName}`,
    detectGender: !!detectGender,
    genderSegments: [],
    genderSummary: null,
    error: null
  };

  res.json({ success: true, batchId: uniqueId });

  // Run python script asynchronously
  (async () => {
    try {
      const scriptPath = path.join(__dirname, 'transcribe.py');
      const pyArgs = [
        scriptPath,
        '--input', absPath,
        '--lang', langCode,
        '--output_srt', srtPath
      ];
      if (detectGender) pyArgs.push('--detect_gender');

      const py = spawn('python', pyArgs);

      py.stdout.on('data', data => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          line = line.trim();
          if (!line) return;
          console.log(`[SUBTITLE] PyOut: ${line}`);

          const progressMatch = line.match(/PROGRESS:\s*(\d+)%/);
          if (progressMatch) {
            activeBatches[uniqueId].progress = parseInt(progressMatch[1]);
          }

          const langMatch = line.match(/Detected language:\s*([\w-]+)/);
          if (langMatch) {
            activeBatches[uniqueId].detectedLanguage = langMatch[1];
          }

          // Parse per-segment gender: "GENDER: <idx>:<MALE|FEMALE|UNKNOWN>"
          const genderMatch = line.match(/^GENDER:\s*(\d+):(MALE|FEMALE|UNKNOWN)/);
          if (genderMatch) {
            activeBatches[uniqueId].genderSegments.push({
              idx: parseInt(genderMatch[1]),
              gender: genderMatch[2]
            });
          }

          // Parse summary: "GENDER_SUMMARY: MALE=X,FEMALE=Y,UNKNOWN=Z"
          const summaryMatch = line.match(/^GENDER_SUMMARY:\s*MALE=(\d+),FEMALE=(\d+),UNKNOWN=(\d+)/);
          if (summaryMatch) {
            activeBatches[uniqueId].genderSummary = {
              male: parseInt(summaryMatch[1]),
              female: parseInt(summaryMatch[2]),
              unknown: parseInt(summaryMatch[3])
            };
          }
        });
      });

      py.stderr.on('data', data => {
        console.error(`[SUBTITLE] PyErr: ${data.toString()}`);
      });

      py.on('close', code => {
        if (code === 0 && fs.existsSync(srtPath)) {
          activeBatches[uniqueId].status = 'completed';
          activeBatches[uniqueId].progress = 100;
          console.log(`[SUBTITLE] Completed: ${srtPath}`);
        } else {
          activeBatches[uniqueId].status = 'failed';
          activeBatches[uniqueId].error = 'Transcription failed or python error';
        }
      });
    } catch (err) {
      activeBatches[uniqueId].status = 'failed';
      activeBatches[uniqueId].error = err.message;
    }
  })();
});

// API: SUBTITLE SAVE (INLINE EDIT SAVE)
app.post('/api/subtitle-save', (req, res) => {
  const { srtPath, content } = req.body;
  if (!srtPath || content === undefined) {
    return res.status(400).json({ error: 'srtPath and content required' });
  }

  const srtFilename = path.basename(srtPath);
  const absSrtPath = path.join(SHORTS_DIR, srtFilename);

  fs.writeFile(absSrtPath, content, 'utf8', (err) => {
    if (err) {
      console.error(`[SAVE-SRT] Error saving file ${absSrtPath}:`, err);
      return res.status(500).json({ error: `Failed to save file: ${err.message}` });
    }
    console.log(`[SAVE-SRT] Saved: ${absSrtPath}`);
    res.json({ success: true, srtPath: `/shorts/${srtFilename}` });
  });
});

// API: SUBTITLE TRANSLATE
app.post('/api/subtitle-translate', (req, res) => {
  const { srtPath, targetLang } = req.body;
  if (!srtPath || !targetLang) return res.status(400).json({ error: 'srtPath and targetLang required' });

  const srtFilename = path.basename(srtPath);
  const absSrtPath = path.join(SHORTS_DIR, srtFilename);
  if (!fs.existsSync(absSrtPath)) return res.status(404).json({ error: 'SRT file not found' });

  const uniqueId = `trans_${Date.now()}`;
  const outSrtName = `translated_${targetLang}_${Date.now()}.srt`;
  const outSrtPath = path.join(SHORTS_DIR, outSrtName);

  activeBatches[uniqueId] = {
    batchId: uniqueId,
    status: 'translating',
    progress: 0,
    translatedSrtPath: `/shorts/${outSrtName}`,
    targetLang,
    error: null
  };

  res.json({ success: true, batchId: uniqueId });

  (async () => {
    try {
      const scriptPath = path.join(__dirname, 'translate.py');
      const py = spawn('python', [
        scriptPath,
        '--input_srt', absSrtPath,
        '--output_srt', outSrtPath,
        '--target_lang', targetLang
      ]);
      py.stdout.on('data', data => {
        const line = data.toString().trim();
        console.log(`[TRANSLATE] ${line}`);
        const match = line.match(/PROGRESS:\s*(\d+)%/);
        if (match) activeBatches[uniqueId].progress = parseInt(match[1]);
      });
      py.stderr.on('data', data => {
        console.error(`[TRANSLATE] Err: ${data.toString()}`);
      });
      py.on('close', code => {
        if (code === 0 && fs.existsSync(outSrtPath)) {
          activeBatches[uniqueId].status = 'completed';
          activeBatches[uniqueId].progress = 100;
        } else {
          activeBatches[uniqueId].status = 'failed';
          activeBatches[uniqueId].error = 'Translation script failed';
        }
      });
    } catch (err) {
      activeBatches[uniqueId].status = 'failed';
      activeBatches[uniqueId].error = err.message;
    }
  })();
});

// API: SUBTITLE BURN
app.post('/api/subtitle-burn', (req, res) => {
  const { filePath, srtPath } = req.body;
  if (!filePath || !srtPath) return res.status(400).json({ error: 'filePath and srtPath required' });

  const absVideoPath = path.resolve(filePath);
  const srtFilename = path.basename(srtPath);
  const absSrtPath = path.join(SHORTS_DIR, srtFilename);

  if (!fs.existsSync(absVideoPath)) return res.status(404).json({ error: 'Video file not found' });
  if (!fs.existsSync(absSrtPath)) return res.status(404).json({ error: 'SRT subtitle file not found' });

  const uniqueId = `burn_${Date.now()}`;
  const outName = `subbed_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.mp4`;
  const outPath = path.join(SHORTS_DIR, outName);

  activeBatches[uniqueId] = {
    batchId: uniqueId,
    status: 'burning',
    progress: 0,
    outputPath: `/shorts/${outName}`,
    error: null
  };

  res.json({ success: true, batchId: uniqueId });

  (async () => {
    try {
      activeBatches[uniqueId].progress = 10;
      
      const localSrtTemp = path.join(__dirname, 'temp_burn.srt');
      fs.copyFileSync(absSrtPath, localSrtTemp);

      const args = [
        '-i', absVideoPath,
        '-vf', 'subtitles=temp_burn.srt',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
        '-c:a', 'copy',
        '-y', outPath
      ];

      console.log(`[BURN] FFmpeg args: ffmpeg ${args.join(' ')}`);
      
      const probe = await probeFile(absVideoPath);
      const duration = parseFloat(probe.format.duration || 30);

      await runFFmpegProgress(args, duration, pct => {
        activeBatches[uniqueId].progress = 15 + Math.round((pct / 100) * 80);
      });

      if (fs.existsSync(localSrtTemp)) {
        try { fs.unlinkSync(localSrtTemp); } catch {}
      }

      if (fs.existsSync(outPath)) {
        activeBatches[uniqueId].status = 'completed';
        activeBatches[uniqueId].progress = 100;
        console.log(`[BURN] Completed: ${outPath}`);
      } else {
        throw new Error('Subtitled video was not created');
      }
    } catch (err) {
      console.error(`[BURN] Error:`, err.message);
      activeBatches[uniqueId].status = 'failed';
      activeBatches[uniqueId].error = err.message;
    }
  })();
});

// API: SRT TO AUDIO (TTS)
app.post('/api/srt-to-audio', async (req, res) => {
  const { srtPath, engine = 'offline', speed = 1.0, lang = 'en', videoPath } = req.body;
  if (!srtPath) return res.status(400).json({ error: 'srtPath required' });

  const srtFilename = path.basename(srtPath);
  const absSrtPath = path.join(SHORTS_DIR, srtFilename);
  if (!fs.existsSync(absSrtPath)) return res.status(404).json({ error: 'SRT file not found' });

  // Get video duration if videoPath is provided
  let videoDurationMs = null;
  if (videoPath) {
    try {
      const absVideoPath = path.resolve(videoPath);
      if (fs.existsSync(absVideoPath)) {
        const probe = await probeFile(absVideoPath);
        if (probe && probe.format && probe.format.duration) {
          videoDurationMs = Math.round(parseFloat(probe.format.duration) * 1000);
          console.log(`[TTS] Probed video duration: ${videoDurationMs}ms`);
        }
      }
    } catch (e) {
      console.error('[TTS] Error probing video path:', e);
    }
  }

  const uniqueId = `tts_${Date.now()}`;
  const audioName = `tts_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.mp3`;
  const audioPath = path.join(SHORTS_DIR, audioName);

  activeBatches[uniqueId] = {
    batchId: uniqueId,
    status: 'generating_audio',
    progress: 0,
    audioPath: `/shorts/${audioName}`,
    segments: null,
    error: null
  };

  res.json({ success: true, batchId: uniqueId });

  (async () => {
    try {
      const scriptPath = path.join(__dirname, 'srt_to_audio.py');
      const pyArgs = [
        scriptPath,
        '--input', absSrtPath,
        '--output', audioPath,
        '--engine', engine,
        '--speed', String(parseFloat(speed).toFixed(2)),
        '--lang', lang
      ];
      if (videoDurationMs) {
        pyArgs.push('--video_duration', String(videoDurationMs));
      }

      const py = spawn('python', pyArgs);

      py.stdout.on('data', data => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          line = line.trim();
          if (!line) return;
          console.log(`[TTS] ${line}`);

          const progressMatch = line.match(/^PROGRESS:\s*(\d+)%/);
          if (progressMatch) {
            activeBatches[uniqueId].progress = parseInt(progressMatch[1]);
          }

          const statusMatch = line.match(/^STATUS:\s*(.+)/);
          if (statusMatch) {
            activeBatches[uniqueId].statusMessage = statusMatch[1];
          }

          const segMatch = line.match(/^SEGMENTS:\s*(\d+)/);
          if (segMatch) {
            activeBatches[uniqueId].segments = parseInt(segMatch[1]);
          }
        });
      });

      py.stderr.on('data', data => {
        console.error(`[TTS] Err: ${data.toString()}`);
      });

      py.on('close', code => {
        if (code === 0 && fs.existsSync(audioPath)) {
          activeBatches[uniqueId].status = 'completed';
          activeBatches[uniqueId].progress = 100;
          console.log(`[TTS] Completed: ${audioPath}`);
        } else {
          activeBatches[uniqueId].status = 'failed';
          activeBatches[uniqueId].error = 'TTS generation failed';
        }
      });
    } catch (err) {
      activeBatches[uniqueId].status = 'failed';
      activeBatches[uniqueId].error = err.message;
    }
  })();
});

// -----------------------------------------------------------------------------
// API: THUMBNAIL AT TIMESTAMP
// Generates a quick JPEG frame from a video on-the-fly and pipes it directly to response.
// -----------------------------------------------------------------------------

app.get('/api/thumbnail-at', (req, res) => {
  const { filePath, time } = req.query;
  if (!filePath || !time) return res.status(400).json({ error: 'filePath and time query parameters are required' });

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  res.setHeader('Content-Type', 'image/jpeg');

  const proc = spawn('ffmpeg', [
    '-ss', String(parseFloat(time)),
    '-i', absPath,
    '-vframes', '1',
    '-q:v', '5',
    '-f', 'image2',
    '-vcodec', 'mjpeg',
    'pipe:1'
  ]);

  proc.stdout.pipe(res);

  req.on('close', () => {
    try { proc.kill('SIGKILL'); } catch (e) {}
  });

  // Suppress stderr/error logs to avoid spam
  proc.stderr.on('data', () => {});
  proc.on('error', (err) => {
    console.error('[API] Thumbnail generation process error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate thumbnail frame' });
  });
});

// -----------------------------------------------------------------------------
// API: HISTORY
// -----------------------------------------------------------------------------

app.get('/api/history', (req, res) => {
  try {
    const history = fs.readdirSync(SHORTS_DIR)
      .filter(f => f.endsWith('.mp4'))
      .map(f => {
        const fp    = path.join(SHORTS_DIR, f);
        const stats = fs.statSync(fp);
        const thumb = `thumb_${path.basename(f, '.mp4')}.jpg`;
        return {
          fileName: f,
          sizeMB: (stats.size / (1024 ** 2)).toFixed(1),
          createdAt: stats.birthtime,
          outputPath: `/shorts/${f}`,
          thumbnailPath: fs.existsSync(path.join(THUMBNAILS_DIR, thumb)) ? `/thumbnails/${thumb}` : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// API: OPEN FOLDER
// -----------------------------------------------------------------------------

app.post('/api/open-folder', (req, res) => {
  const cmd = process.platform === 'win32'
    ? `start "" "${SHORTS_DIR}"`
    : process.platform === 'darwin' ? `open "${SHORTS_DIR}"` : `xdg-open "${SHORTS_DIR}"`;

  exec(cmd, { shell: true }, err => {
    if (err) return res.status(500).json({ error: 'Could not open folder' });
    res.json({ success: true });
  });
});

// -----------------------------------------------------------------------------
// API: VIDEO STREAM  (byte-range streaming for Crop Studio <video> element)
// -----------------------------------------------------------------------------

app.get('/api/video-stream', (req, res) => {
  const { filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  const stat     = fs.statSync(absPath);
  const fileSize = stat.size;
  const range    = req.headers.range;

  const ext      = path.extname(absPath).toLowerCase();
  const mimeMap  = { '.mp4':'video/mp4', '.mkv':'video/x-matroska', '.mov':'video/quicktime', '.avi':'video/x-msvideo', '.webm':'video/webm' };
  const contentType = mimeMap[ext] || 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end   = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': (end - start) + 1,
      'Content-Type':   contentType,
    });
    fs.createReadStream(absPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(absPath).pipe(res);
  }
});

// -----------------------------------------------------------------------------
// API: CROP RENDER  (Crop Studio → FFmpeg crop+scale → 9:16 short)
// -----------------------------------------------------------------------------

// Global sequential render queue variables
const renderQueue = [];
let activeRendersCount = 0;
const MAX_CONCURRENT_RENDERS = 2; // Process at most 2 FFmpeg renders in parallel

async function runRenderJob({
  reqBody,
  job,
  batchId,
  absPath
}) {
  try {
    const {
      filePath, startSec = 0, duration = 30,
      cropX = 0, cropY = 0, cropW, cropH,
      fitMode = 'blur',
      outputFolder = null,
    } = reqBody;

    job.status = 'processing'; job.progress = 5;

    const format  = reqBody.format === 'webm' ? 'webm' : 'mp4';
    const outTs   = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const outName = `crop_${outTs}_${Math.floor(1000 + Math.random() * 9000)}.${format}`;
    
    // Determine output directory based on folder parameter
    let outputDir = SHORTS_DIR;
    if (outputFolder) {
      // Sanitize folder name to prevent path traversal
      const safeFolder = outputFolder.replace(/[^\w\s-]/g, '').trim();
      outputDir = path.join(SHORTS_DIR, safeFolder);
      // Create folder if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`[CROP] Created folder: ${outputDir}`);
      }
    }
    
    const outPath = path.join(outputDir, outName);
    console.log(`[CROP] Output path: ${outPath}`);

    // Build vf filter: crop then scale to 9:16 (YouTube Shorts standard)
    const cX = Math.round(cropX), cY = Math.round(cropY);
    const cW = Math.round(cropW / 2) * 2, cH = Math.round(cropH / 2) * 2;

    // Ensure crop dimensions are valid
    if (cW <= 0 || cH <= 0) {
      throw new Error(`Invalid crop dimensions: ${cW}x${cH}`);
    }

    let vf;
    if (fitMode === 'blur') {
      // Blur background with centered foreground - YouTube Shorts 9:16
      vf = `crop=${cW}:${cH}:${cX}:${cY},split[fg][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[blurred];[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgsc];[blurred][fgsc]overlay=(W-w)/2:(H-h)/2`;
    } else {
      // Simple crop and scale to 9:16
      vf = `crop=${cW}:${cH}:${cX}:${cY},scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
    }

    const probe    = await probeFile(absPath);
    const hasAudio = probe.streams.some(s => s.codec_type === 'audio');

    const baseArgs = [
      '-ss', String(parseFloat(startSec).toFixed(3)),
      '-t',  String(parseFloat(duration).toFixed(3)),
      '-i',  absPath,
    ];

    const isWebm = (format === 'webm');
    const encArgs = [
      '-vf', vf,
      '-r', '30',
      '-s', '1080x1920',  // Force YouTube Shorts resolution
      '-aspect', '9:16'    // Force aspect ratio
    ];

    if (isWebm) {
      encArgs.push(
        '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0',
        '-c:a', 'libopus', '-b:a', '96k',
        '-y', outPath
      );
    } else {
      encArgs.push(
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        '-profile:v', 'high',
        '-level', '4.0',
        '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '128k',
        '-movflags', '+faststart', '-y', outPath
      );
    }

    let args;
    if (hasAudio) {
      args = [...baseArgs, ...encArgs];
    } else {
      if (isWebm) {
        args = [
          ...baseArgs,
          '-f', 'lavfi', '-t', String(parseFloat(duration).toFixed(3)),
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
          '-map', '0:v:0', '-map', '1:a:0',
          ...encArgs.slice(0, -2),  // all except -y outPath
          '-shortest', '-y', outPath
        ];
      } else {
        args = [
          ...baseArgs,
          '-f', 'lavfi', '-t', String(parseFloat(duration).toFixed(3)),
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-map', '0:v:0', '-map', '1:a:0',
          ...encArgs.slice(0, -2),  // all except -y outPath
          '-shortest', '-y', outPath
        ];
      }
    }

    job.status = `Rendering crop (${cW}×${cH} → 1080×1920 9:16)…`;
    console.log(`[CROP] FFmpeg args:`, args.join(' '));
    await runFFmpegProgress(args, parseFloat(duration), pct => {
      job.progress = 10 + Math.round((pct / 100) * 82);
    });

    // Verify output file exists
    if (!fs.existsSync(outPath)) {
      throw new Error('Output file was not created');
    }

    // Verify output file has content
    const stats = fs.statSync(outPath);
    if (stats.size === 0) {
      throw new Error('Output file is empty');
    }
    console.log(`[CROP] Output file size: ${stats.size} bytes`);

    // Thumbnail
    job.status = 'Generating thumbnail…'; job.progress = 93;
    const thumbName = `thumb_${path.basename(outName, path.extname(outName))}.jpg`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
    await runCommand('ffmpeg', ['-ss', '0.5', '-i', outPath, '-vframes', '1', '-q:v', '2', thumbPath, '-y']).catch(() => {});

    job.status = 'completed'; job.progress = 100;
    job.outputFileName = outName;
    const relativePath = outputFolder ? path.join(outputFolder, outName) : outName;
    job.outputPath     = `/shorts/${relativePath.replace(/\\/g, '/')}`;
    job.thumbnailPath  = `/thumbnails/${thumbName}`;
    job.outputFolder   = outputFolder || '';
    activeBatches[batchId].status = 'completed';
    console.log(`[CROP] Done: ${outName} in folder: ${outputFolder || 'shorts'}`);
  } catch (err) {
    console.error('[CROP] Error:', err.message);
    console.error('[CROP] Stack:', err.stack);
    job.status = 'failed'; job.error = err.message; job.progress = 100;
    activeBatches[batchId].status = 'failed';
  }
}

async function runTrimJob({
  reqBody,
  job,
  batchId,
  absPath
}) {
  try {
    const {
      filePath, startSec = 0, duration = 30,
      format = 'mp4',
    } = reqBody;

    job.status = 'processing'; job.progress = 5;

    const formatExt = format === 'webm' ? 'webm' : 'mp4';
    const outTs   = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const outName = `trim_${outTs}_${Math.floor(1000 + Math.random() * 9000)}.${formatExt}`;
    const outPath = path.join(SHORTS_DIR, outName);
    console.log(`[TRIM] Output path: ${outPath}`);

    const probe    = await probeFile(absPath);
    const hasAudio = probe.streams.some(s => s.codec_type === 'audio');

    const baseArgs = [
      '-ss', String(parseFloat(startSec).toFixed(3)),
      '-t',  String(parseFloat(duration).toFixed(3)),
      '-i',  absPath,
    ];

    const isWebm = (format === 'webm');
    const encArgs = [];

    if (isWebm) {
      encArgs.push(
        '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0',
        '-c:a', 'libopus', '-b:a', '96k',
        '-y', outPath
      );
    } else {
      encArgs.push(
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        '-c:a', 'aac', '-ac', '2', '-ar', '44100', '-b:a', '128k',
        '-movflags', '+faststart', '-y', outPath
      );
    }

    let args;
    if (hasAudio) {
      args = [...baseArgs, ...encArgs];
    } else {
      if (isWebm) {
        args = [
          ...baseArgs,
          '-f', 'lavfi', '-t', String(parseFloat(duration).toFixed(3)),
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
          '-map', '0:v:0', '-map', '1:a:0',
          ...encArgs.slice(0, -2),
          '-shortest', '-y', outPath
        ];
      } else {
        args = [
          ...baseArgs,
          '-f', 'lavfi', '-t', String(parseFloat(duration).toFixed(3)),
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-map', '0:v:0', '-map', '1:a:0',
          ...encArgs.slice(0, -2),
          '-shortest', '-y', outPath
        ];
      }
    }

    job.status = `Trimming video…`;
    console.log(`[TRIM] FFmpeg args:`, args.join(' '));
    await runFFmpegProgress(args, parseFloat(duration), pct => {
      job.progress = 10 + Math.round((pct / 100) * 82);
    });

    if (!fs.existsSync(outPath)) {
      throw new Error('Output file was not created');
    }

    const stats = fs.statSync(outPath);
    if (stats.size === 0) {
      throw new Error('Output file is empty');
    }

    // Thumbnail
    job.status = 'Generating thumbnail…'; job.progress = 93;
    const thumbName = `thumb_${path.basename(outName, path.extname(outName))}.jpg`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
    await runCommand('ffmpeg', ['-ss', '0.5', '-i', outPath, '-vframes', '1', '-q:v', '2', thumbPath, '-y']).catch(() => {});

    job.status = 'completed'; job.progress = 100;
    job.outputFileName = outName;
    job.outputPath     = `/shorts/${outName}`;
    job.thumbnailPath  = `/thumbnails/${thumbName}`;
    activeBatches[batchId].status = 'completed';
    console.log(`[TRIM] Done: ${outName}`);
  } catch (err) {
    console.error('[TRIM] Error:', err.message);
    job.status = 'failed'; job.error = err.message; job.progress = 100;
    activeBatches[batchId].status = 'failed';
  }
}

function processNextQueueJob() {
  if (renderQueue.length === 0) return;
  if (activeRendersCount >= MAX_CONCURRENT_RENDERS) return;

  const next = renderQueue.shift();
  activeRendersCount++;
  
  // Set job status
  next.job.status = 'Processing in render queue...';
  
  const runner = next.batchId.startsWith('trim_') ? runTrimJob(next) : runRenderJob(next);
  runner.finally(() => {
    activeRendersCount--;
    processNextQueueJob();
  });
}

app.post('/api/crop-render', async (req, res) => {
  const {
    filePath, startSec = 0, duration = 30,
    cropX = 0, cropY = 0, cropW, cropH,
    fitMode = 'blur',
    outputFolder = null,
  } = req.body;

  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  if (!cropW || !cropH) return res.status(400).json({ error: 'cropW and cropH required' });
  if (duration <= 0) return res.status(400).json({ error: 'duration must be positive' });
  if (startSec < 0) return res.status(400).json({ error: 'startSec must be non-negative' });

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  const uniqueId = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const batchId = `crop_${uniqueId}`;
  const job = {
    jobId: `${batchId}_job_0`, index: 0,
    status: 'queued in background', progress: 0,
    error: null, outputFileName: null, outputPath: null, thumbnailPath: null
  };
  activeBatches[batchId] = { batchId, status: 'processing', shortCount: 1, jobs: [job] };
  res.json({ success: true, batchId });   // respond immediately; render runs async

  // Push rendering parameters to global queue
  renderQueue.push({
    reqBody: req.body,
    job,
    batchId,
    absPath
  });

  // Trigger processing
  processNextQueueJob();
});

app.post('/api/trim-render', async (req, res) => {
  const {
    filePath, startSec = 0, duration = 30,
    format = 'mp4',
  } = req.body;

  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  if (duration <= 0) return res.status(400).json({ error: 'duration must be positive' });
  if (startSec < 0) return res.status(400).json({ error: 'startSec must be non-negative' });

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  const uniqueId = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const batchId = `trim_${uniqueId}`;
  const job = {
    jobId: `${batchId}_job_0`, index: 0,
    status: 'queued in background', progress: 0,
    error: null, outputFileName: null, outputPath: null, thumbnailPath: null
  };
  activeBatches[batchId] = { batchId, status: 'processing', shortCount: 1, jobs: [job] };
  res.json({ success: true, batchId });

  renderQueue.push({
    reqBody: req.body,
    job,
    batchId,
    absPath
  });

  processNextQueueJob();
});


// Fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`[SYS] AIVERSE STUDIOS backend loaded  →  http://localhost:${PORT}`);
});
