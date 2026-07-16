const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
  SHORTS_DIR,
  TEMP_DIR,
  THUMBNAILS_DIR,
  activeBatches,
  VIDEO_EXTS,
  runCommand,
  runFFmpegProgress,
  probeFile,
  buildVideoFilter
} = require('./shared');

// Encode a template clip with automatic silent-audio injection when source has no audio.
async function encodeTemplateClip({ src, startSec, durationSec, outPath, aspectRatio, fitMode, overlayText, volume, panX = 0, fps = 30 }, onProgress) {
  const probe   = await probeFile(src);
  const hasAudio = probe.streams.some(s => s.codec_type === 'audio');
  const vf       = buildVideoFilter(aspectRatio, fitMode, overlayText, panX);

  let args;
  if (hasAudio) {
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
    args = [
      '-ss', String(startSec), '-t', String(durationSec),
      '-i',  src,
      '-f', 'lavfi', '-t', String(durationSec),
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-map', '0:v:0',
      '-map', '1:a:0',
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
    for (let i = 0; i < numClips; i++) {
      const start = Math.random() * Math.max(0, videoDuration - clipDuration);
      clips.push({ start: parseFloat(start.toFixed(2)), duration: clipDuration, panX: 0 });
    }
  }
  return clips;
}

// Stitch N segments with transitions
async function stitchWithFades(clipPaths, outPath, fadeDuration = 0.5, job = null) {
  const n   = clipPaths.length;
  const F   = Math.max(0, parseFloat(fadeDuration) || 0);

  if (F === 0) {
    const tmpList = outPath + '_list.txt';
    fs.writeFileSync(tmpList,
      clipPaths.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "\\'")}'`).join('\n'),
      'utf8');
    await runCommand('ffmpeg', ['-f','concat','-safe','0','-i',tmpList,'-c','copy','-y',outPath]);
    try { fs.unlinkSync(tmpList); } catch (_) {}
    return;
  }

  const durations = await Promise.all(clipPaths.map(async p => {
    const info = await probeFile(p);
    return parseFloat(info.format.duration) || 5;
  }));

  const inputArgs = [];
  clipPaths.forEach(p => { inputArgs.push('-i', p); });

  const filterParts  = [];
  const videoLabels  = [];
  const audioLabels  = [];

  for (let i = 0; i < n; i++) {
    const D  = durations[i];
    const f  = Math.min(F, D * 0.45);
    const vo = `[fv${i}]`;
    const ao = `[fa${i}]`;

    const isFirst = i === 0;
    const isLast  = i === n - 1;

    let vChain = `[${i}:v]`;
    if (!isFirst) {
      vChain += `fade=t=in:st=0:d=${f.toFixed(3)}:color=black,`;
    }
    if (!isLast) {
      vChain += `fade=t=out:st=${(D - f).toFixed(3)}:d=${f.toFixed(3)}:color=black`;
    }
    vChain = vChain.replace(/,$/, '');
    if (vChain === `[${i}:v]`) {
      vChain += `copy`;
    }
    filterParts.push(`${vChain}${vo}`);

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

// Background generation orchestrator
async function processBatch(batchId, srcPath, srcDur, hasVideo, cfg) {
  const batch = activeBatches[batchId];
  if (!batch) return;

  const {
    shortCount, totalDuration, vibe, aspectRatio, fitMode, overlayText, volume,
    mode, clips: manualClips, fadeDuration = 0.5,
    useTemplate, templateMidFile, templateEndFile,
    templateMidDuration, templateEndDuration
  } = cfg;

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

      const jobTs = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      await new Promise(r => setTimeout(r, 100));
      const finalName = `short_${jobTs}_${j + 1}.mp4`;
      const finalPath = path.join(SHORTS_DIR, finalName);

      const cutsDirName = `short_${jobTs}_${j + 1}_cuts`;
      const cutsDir = path.join(SHORTS_DIR, cutsDirName);
      if (!fs.existsSync(cutsDir)) fs.mkdirSync(cutsDir, { recursive: true });

      let clips;
      if (mode === 'manual') {
        if (j === 0 && manualClips && manualClips.length > 0) {
          clips = manualClips;
        } else {
          clips = generateNonOverlappingClips(srcDur, 4, 5);
        }
      } else {
        clips = flatClips.slice(j * 4, (j + 1) * 4);
      }

      job.status = `Encoding ${clips.length} cuts to ${cutsDirName}/...`;
      job.progress = 8;

      const encodedClips = [];

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

      let midClipPath = null, endClipPath = null;

      if (useTemplate) {
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
          overlayText,
          volume,
        }, pct => { job.progress = 73 + Math.round((pct / 100) * 7); });
      }

      let orderedPaths = [];

      if (useTemplate && midClipPath && endClipPath) {
        const half    = Math.ceil(encodedClips.length / 2);
        const firstH  = encodedClips.slice(0, half).map(c => c.path);
        const secondH = encodedClips.slice(half).map(c => c.path);
        orderedPaths  = [...firstH, midClipPath, ...secondH, endClipPath];
      } else {
        orderedPaths = encodedClips.map(c => c.path);
      }

      job.status = 'Stitching with cinematic transitions...';
      job.progress = 82;

      await stitchWithFades(orderedPaths, finalPath, fadeDuration, job);

      job.status = 'Generating thumbnail...';
      job.progress = 92;

      const thumbName = `thumb_${path.basename(finalName, '.mp4')}.jpg`;
      const thumbPath = path.join(THUMBNAILS_DIR, thumbName);
      await runCommand('ffmpeg', ['-ss', '0.5', '-i', finalPath, '-vframes', '1', '-q:v', '2', thumbPath, '-y']);

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

// Routes
router.post('/probe', async (req, res) => {
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

router.post('/scan-template', async (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'folderPath required' });

  const absFolder = path.resolve(folderPath);
  if (!fs.existsSync(absFolder)) return res.status(404).json({ error: `Folder not found: ${folderPath}` });

  try {
    const files = fs.readdirSync(absFolder)
      .filter(f => VIDEO_EXTS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(absFolder, f));

    if (files.length < 2) return res.status(400).json({ error: 'Template folder must contain at least 2 video files (Video1 + TitleCard).' });

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

router.post('/generate', async (req, res) => {
  const {
    filePath,
    shortCount   = 1,
    totalDuration = 30,
    vibe         = 'cinematic',
    aspectRatio  = 'vertical',
    fitMode      = 'blur',
    overlayText  = '',
    volume       = 1.0,
    timelineClips = null,
    mode         = 'automatic',
    clips        = null,
    fadeDuration  = 0.5,
    useTemplate   = false,
    templateMidFile = null,
    templateEndFile = null,
    templateMidDuration = 3,
    templateEndDuration = 3,
  } = req.body;

  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return res.status(404).json({ error: `File not found: ${filePath}` });

  try {
    const probe      = await probeFile(absPath);
    const srcDur     = parseFloat(probe.format.duration);
    const hasVideo   = probe.streams.some(s => s.codec_type === 'video');

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

router.get('/status/:batchId', (req, res) => {
  const batch = activeBatches[req.params.batchId];
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  res.json(batch);
});

router.get('/list-shorts', (req, res) => {
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

  results.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ success: true, shorts: results });
});

router.get('/history', (req, res) => {
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

router.post('/open-folder', (req, res) => {
  const cmd = process.platform === 'win32'
    ? `start "" "${SHORTS_DIR}"`
    : process.platform === 'darwin' ? `open "${SHORTS_DIR}"` : `xdg-open "${SHORTS_DIR}"`;

  exec(cmd, { shell: true }, err => {
    if (err) return res.status(500).json({ error: 'Could not open folder' });
    res.json({ success: true });
  });
});

module.exports = router;
