const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const SHORTS_DIR = path.join(__dirname, '..', 'shorts');
const TEMP_DIR   = path.join(__dirname, '..', 'temp');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

[SHORTS_DIR, TEMP_DIR, PUBLIC_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const activeBatches = {};
const renderQueue = [];
let activeRendersCount = 0;
const MAX_CONCURRENT_RENDERS = 2;
const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

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

module.exports = {
  SHORTS_DIR,
  TEMP_DIR,
  PUBLIC_DIR,
  THUMBNAILS_DIR,
  activeBatches,
  renderQueue,
  activeRendersCount: () => activeRendersCount,
  incrementRenders: () => { activeRendersCount++; },
  decrementRenders: () => { activeRendersCount--; },
  MAX_CONCURRENT_RENDERS,
  VIDEO_EXTS,
  runCommand,
  runFFmpegProgress,
  probeFile,
  buildVideoFilter
};
