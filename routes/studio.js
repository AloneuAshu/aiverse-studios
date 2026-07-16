const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  SHORTS_DIR,
  THUMBNAILS_DIR,
  activeBatches,
  renderQueue,
  activeRendersCount,
  incrementRenders,
  decrementRenders,
  MAX_CONCURRENT_RENDERS,
  runCommand,
  runFFmpegProgress,
  probeFile
} = require('./shared');

// Serve video helper
function serveVideoFile(filePath, req, res) {
  const absPath = path.resolve(filePath);
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
}

router.get('/serve-video', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  serveVideoFile(decodeURIComponent(filePath), req, res);
});

router.get('/video-stream', (req, res) => {
  const filePath = req.query.filePath;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  serveVideoFile(decodeURIComponent(filePath), req, res);
});

router.get('/thumbnail-at', (req, res) => {
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

  proc.stderr.on('data', () => {});
  proc.on('error', (err) => {
    console.error('[API] Thumbnail generation process error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate thumbnail frame' });
  });
});

async function runRenderJob({ reqBody, job, batchId, absPath }) {
  try {
    const {
      startSec = 0, duration = 30,
      cropX = 0, cropY = 0, cropW, cropH,
      fitMode = 'blur',
      outputFolder = null,
    } = reqBody;

    job.status = 'processing'; job.progress = 5;

    const format  = reqBody.format === 'webm' ? 'webm' : 'mp4';
    const outTs   = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const outName = `crop_${outTs}_${Math.floor(1000 + Math.random() * 9000)}.${format}`;
    
    let outputDir = SHORTS_DIR;
    if (outputFolder) {
      const safeFolder = outputFolder.replace(/[^\w\s-]/g, '').trim();
      outputDir = path.join(SHORTS_DIR, safeFolder);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`[CROP] Created folder: ${outputDir}`);
      }
    }
    
    const outPath = path.join(outputDir, outName);
    console.log(`[CROP] Output path: ${outPath}`);

    const cX = Math.round(cropX), cY = Math.round(cropY);
    const cW = Math.round(cropW / 2) * 2, cH = Math.round(cropH / 2) * 2;

    if (cW <= 0 || cH <= 0) {
      throw new Error(`Invalid crop dimensions: ${cW}x${cH}`);
    }

    let vf;
    if (fitMode === 'blur') {
      vf = `crop=${cW}:${cH}:${cX}:${cY},split[fg][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[blurred];[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgsc];[blurred][fgsc]overlay=(W-w)/2:(H-h)/2`;
    } else {
      vf = `crop=${cW}:${cH}:${cX}:${cY},scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black`;
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
      '-s', '1080x1920',
      '-aspect', '9:16'
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

    job.status = `Rendering crop (${cW}×${cH} → 1080×1920 9:16)…`;
    console.log(`[CROP] FFmpeg args:`, args.join(' '));
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
    job.status = 'failed'; job.error = err.message; job.progress = 100;
    activeBatches[batchId].status = 'failed';
  }
}

async function runTrimJob({ reqBody, job, batchId, absPath }) {
  try {
    const {
      startSec = 0, duration = 30,
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
  if (activeRendersCount() >= MAX_CONCURRENT_RENDERS) return;

  const next = renderQueue.shift();
  incrementRenders();
  
  next.job.status = 'Processing in render queue...';
  
  const runner = next.batchId.startsWith('trim_') ? runTrimJob(next) : runRenderJob(next);
  runner.finally(() => {
    decrementRenders();
    processNextQueueJob();
  });
}

router.post('/crop-render', async (req, res) => {
  const {
    filePath, startSec = 0, duration = 30,
    cropX = 0, cropY = 0, cropW, cropH,
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
  res.json({ success: true, batchId });

  renderQueue.push({
    reqBody: req.body,
    job,
    batchId,
    absPath
  });

  processNextQueueJob();
});

router.post('/trim-render', async (req, res) => {
  const {
    filePath, startSec = 0, duration = 30,
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

module.exports = router;
