const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  SHORTS_DIR,
  activeBatches,
  probeFile,
  runFFmpegProgress
} = require('./shared');

router.post('/subtitle-generate', (req, res) => {
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

  (async () => {
    try {
      const scriptPath = path.join(__dirname, '..', 'transcribe.py');
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

          const genderMatch = line.match(/^GENDER:\s*(\d+):(MALE|FEMALE|UNKNOWN)/);
          if (genderMatch) {
            activeBatches[uniqueId].genderSegments.push({
              idx: parseInt(genderMatch[1]),
              gender: genderMatch[2]
            });
          }

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

router.post('/subtitle-save', (req, res) => {
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

router.post('/subtitle-translate', (req, res) => {
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
      const scriptPath = path.join(__dirname, '..', 'translate.py');
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

router.post('/subtitle-burn', (req, res) => {
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
      
      const localSrtTemp = path.join(__dirname, '..', 'temp_burn.srt');
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

router.post('/srt-to-audio', async (req, res) => {
  const { srtPath, engine = 'offline', speed = 1.0, lang = 'en', videoPath } = req.body;
  if (!srtPath) return res.status(400).json({ error: 'srtPath required' });

  const srtFilename = path.basename(srtPath);
  const absSrtPath = path.join(SHORTS_DIR, srtFilename);
  if (!fs.existsSync(absSrtPath)) return res.status(404).json({ error: 'SRT file not found' });

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
      const scriptPath = path.join(__dirname, '..', 'srt_to_audio.py');
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

module.exports = router;
