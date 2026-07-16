import { $, toast, fmtSec } from './utils.js';

export function initSubtitles() {
  const subFilePath = $('subFilePath');
  const subBtnBrowse = $('subBtnBrowse');
  const subBtnAnalyze = $('subBtnAnalyze');
  const subProbeResult = $('subProbeResult');
  const subMetaFileName = $('subMetaFileName');
  const subMetaDuration = $('subMetaDuration');
  const subMetaResolution = $('subMetaResolution');
  const subConfigSection = $('subConfigSection');
  const subLanguageSelect = $('subLanguageSelect');
  const subBtnGenerate = $('subBtnGenerate');
  const subTranslateSection = $('subTranslateSection');
  const subTargetLangSelect = $('subTargetLangSelect');
  const subBtnTranslate = $('subBtnTranslate');
  const subBurnSection = $('subBurnSection');
  const subBtnBurnVideo = $('subBtnBurnVideo');
  const subEmptyState = $('subEmptyState');
  const subProgressSection = $('subProgressSection');
  const subProgressFill = $('subProgressFill');
  const subStatusText = $('subStatusText');
  const subResultsSection = $('subResultsSection');
  const subResultLang = $('subResultLang');
  const subBtnDownloadSrt = $('subBtnDownloadSrt');
  const subSrtPreviewText = $('subSrtPreviewText');
  const subTranslateProgressSection = $('subTranslateProgressSection');
  const subTranslateProgressFill = $('subTranslateProgressFill');
  const subTranslateStatusText = $('subTranslateStatusText');
  const subTranslatedResultSection = $('subTranslatedResultSection');
  const subTranslatedLangLabel = $('subTranslatedLangLabel');
  const subBtnDownloadTranslatedSrt = $('subBtnDownloadTranslatedSrt');
  const subTranslatedSrtPreview = $('subTranslatedSrtPreview');
  const subBurnProgressSection = $('subBurnProgressSection');
  const subBurnProgressFill = $('subBurnProgressFill');
  const subBurnStatusText = $('subBurnStatusText');
  const subBurnResultSection = $('subBurnResultSection');
  const subBurnResultLink = $('subBurnResultLink');

  const subBtnSaveSrt = $('subBtnSaveSrt');
  const subBtnSaveTranslatedSrt = $('subBtnSaveTranslatedSrt');

  let currentSrtPath = null;
  let currentBurnSrtPath = null;

  if (subBtnSaveSrt) {
    subBtnSaveSrt.addEventListener('click', async () => {
      if (!currentSrtPath) { toast('No subtitle path found', 'error'); return; }
      subBtnSaveSrt.disabled = true;
      subBtnSaveSrt.textContent = '⏳ Saving...';
      try {
        const r = await fetch('/api/subtitle-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            srtPath: currentSrtPath,
            content: subSrtPreviewText.value
          })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to save');
        toast('Original subtitles saved successfully! 💾');
      } catch (e) {
        toast(e.message || 'Failed to save changes', 'error');
      }
      subBtnSaveSrt.disabled = false;
      subBtnSaveSrt.textContent = '💾 Save Changes';
    });
  }

  if (subBtnSaveTranslatedSrt) {
    subBtnSaveTranslatedSrt.addEventListener('click', async () => {
      if (!currentTranslatedSrtPath) { toast('No translated subtitle path found', 'error'); return; }
      subBtnSaveTranslatedSrt.disabled = true;
      subBtnSaveTranslatedSrt.textContent = '⏳ Saving...';
      try {
        const r = await fetch('/api/subtitle-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            srtPath: currentTranslatedSrtPath,
            content: subTranslatedSrtPreview.value
          })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to save');
        toast('Translated subtitles saved successfully! 💾');
      } catch (e) {
        toast(e.message || 'Failed to save changes', 'error');
      }
      subBtnSaveTranslatedSrt.disabled = false;
      subBtnSaveTranslatedSrt.textContent = '💾 Save Changes';
    });
  }

  subBtnBrowse.addEventListener('click', async () => {
    subBtnBrowse.textContent = '...';
    subBtnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Browse failed');
      if (d.filePath) { subFilePath.value = d.filePath; toast('File selected'); }
    } catch (e) { toast(e.message || 'Failed to open browser', 'error'); }
    subBtnBrowse.textContent = 'BROWSE';
    subBtnBrowse.disabled = false;
  });

  subBtnAnalyze.addEventListener('click', async () => {
    const fp = subFilePath.value.trim();
    if (!fp) { toast('Please enter a file path', 'error'); return; }
    subBtnAnalyze.textContent = 'ANALYZING...';
    subBtnAnalyze.disabled = true;
    try {
      const r = await fetch('/api/probe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fp })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analyze failed');
      subMetaFileName.textContent = d.fileName;
      subMetaDuration.textContent = fmtSec(d.duration);
      subMetaResolution.textContent = `${d.width} x ${d.height}`;
      subProbeResult.classList.remove('hidden');
      subConfigSection.classList.remove('disabled-state');
      toast('Video analyzed');
    } catch (e) { toast(e.message, 'error'); }
    subBtnAnalyze.textContent = 'ANALYZE';
    subBtnAnalyze.disabled = false;
  });

  subBtnTranslate.addEventListener('click', async () => {
    if (!currentSrtPath) { toast('Transcribe a video first', 'error'); return; }
    const targetLang = subTargetLangSelect.value;
    const targetLabel = subTargetLangSelect.options[subTargetLangSelect.selectedIndex].text;
    subBtnTranslate.disabled = true;
    subTranslatedResultSection.classList.add('hidden');
    subTranslateProgressSection.classList.remove('hidden');
    subTranslateProgressFill.style.width = '0%';
    subTranslateStatusText.textContent = `Translating to ${targetLabel}...`;
    try {
      const r = await fetch('/api/subtitle-translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srtPath: currentSrtPath, targetLang })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Translation failed');

      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`/api/status/${d.batchId}`);
          const sd = await sr.json();
          if (sd.status === 'translating') {
            subTranslateProgressFill.style.width = `${sd.progress}%`;
            subTranslateStatusText.textContent = `Translating subtitles: ${sd.progress}%`;
          } else if (sd.status === 'completed') {
            clearInterval(poll);
            subTranslateProgressSection.classList.add('hidden');
            currentBurnSrtPath = sd.translatedSrtPath;
            subBtnDownloadTranslatedSrt.href = sd.translatedSrtPath;
            subTranslatedLangLabel.textContent = `Translated to: ${targetLabel}`;
            try {
              const txt = await (await fetch(sd.translatedSrtPath)).text();
              subTranslatedSrtPreview.value = txt;
            } catch {}
            subTranslatedResultSection.classList.remove('hidden');
            toast(`Translated to ${targetLabel}!`);
            subBtnTranslate.disabled = false;
          } else if (sd.status === 'failed') {
            clearInterval(poll);
            throw new Error(sd.error || 'Translation failed');
          }
        } catch (err) {
          clearInterval(poll);
          subTranslateProgressSection.classList.add('hidden');
          toast(err.message, 'error');
          subBtnTranslate.disabled = false;
        }
      }, 1000);
    } catch (e) {
      subTranslateProgressSection.classList.add('hidden');
      toast(e.message, 'error');
      subBtnTranslate.disabled = false;
    }
  });

  subBtnBurnVideo.addEventListener('click', async () => {
    const fp = subFilePath.value.trim();
    if (!fp || !currentBurnSrtPath) { toast('Transcribe a video first', 'error'); return; }
    subBtnBurnVideo.disabled = true;
    subBurnResultSection.classList.add('hidden');
    subBurnProgressSection.classList.remove('hidden');
    subBurnProgressFill.style.width = '0%';
    subBurnStatusText.textContent = 'Starting FFmpeg burn process...';
    try {
      const r = await fetch('/api/subtitle-burn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fp, srtPath: currentBurnSrtPath })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Burn failed');

      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`/api/status/${d.batchId}`);
          const sd = await sr.json();
          if (sd.status === 'burning') {
            subBurnProgressFill.style.width = `${sd.progress}%`;
            subBurnStatusText.textContent = `Burning subtitles (FFmpeg): ${sd.progress}%`;
          } else if (sd.status === 'completed') {
            clearInterval(poll);
            subBurnProgressSection.classList.add('hidden');
            subBurnResultLink.href = sd.outputPath;
            subBurnResultSection.classList.remove('hidden');
            toast('Subtitles burned into video!');
            subBtnBurnVideo.disabled = false;
          } else if (sd.status === 'failed') {
            clearInterval(poll);
            throw new Error(sd.error || 'Burning failed');
          }
        } catch (err) {
          clearInterval(poll);
          subBurnProgressSection.classList.add('hidden');
          toast(err.message, 'error');
          subBtnBurnVideo.disabled = false;
        }
      }, 1000);
    } catch (e) {
      subBurnProgressSection.classList.add('hidden');
      toast(e.message, 'error');
      subBtnBurnVideo.disabled = false;
    }
  });

  const subDetectGender = $('subDetectGender');
  if (subDetectGender) {
    subDetectGender.addEventListener('change', () => {
      const genBtn = $('subBtnGenerate');
      if (genBtn) {
        genBtn.textContent = subDetectGender.checked
          ? 'STEP 1 - TRANSCRIBE + DETECT GENDER'
          : 'STEP 1 - TRANSCRIBE AUDIO TO SRT';
      }
    });
  }

  const oldBtn = subBtnGenerate;
  if (oldBtn) {
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    newBtn.addEventListener('click', async () => {
      const fp = subFilePath.value.trim();
      if (!fp) return;
      const detectGender = $('subDetectGender') ? $('subDetectGender').checked : false;
      const subLangSel = $('subLanguageSelect');
      const subProgSec = $('subProgressSection');
      const subProgFill = $('subProgressFill');
      const subStatTxt = $('subStatusText');
      const subEmptyS = $('subEmptyState');
      const subResSec = $('subResultsSection');
      const subTransSec = $('subTranslateSection');
      const subBurnSec = $('subBurnSection');
      const subTtsSec = $('subTtsSection');
      const subResLang = $('subResultLang');
      const subDlSrt = $('subBtnDownloadSrt');
      const subSrtPrev = $('subSrtPreviewText');

      newBtn.disabled = true;
      subEmptyS.classList.add('hidden');
      subResSec.classList.add('hidden');
      subTransSec.classList.add('disabled-state');
      subBurnSec.classList.add('disabled-state');
      subTtsSec && subTtsSec.classList.add('disabled-state');
      subProgSec.classList.remove('hidden');
      subProgFill.style.width = '0%';
      subStatTxt.textContent = detectGender
        ? 'Extracting audio, initializing transcription + gender detection...'
        : 'Extracting audio and initializing transcription...';

      try {
        const r = await fetch('/api/subtitle-generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: fp, langCode: subLangSel.value, detectGender })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Generation failed');

        const poll = setInterval(async () => {
          try {
            const sr = await fetch(`/api/status/${d.batchId}`);
            const sd = await sr.json();
            if (sd.status === 'transcribing') {
              subProgFill.style.width = `${sd.progress}%`;
              subStatTxt.textContent = detectGender
                ? `Transcribing + detecting gender: ${sd.progress}%`
                : `Transcribing audio chunks: ${sd.progress}%`;
            } else if (sd.status === 'completed') {
              clearInterval(poll);
              subProgSec.classList.add('hidden');
              currentSrtPath = sd.srtPath;
              currentBurnSrtPath = sd.srtPath;
              subDlSrt.href = sd.srtPath;
              subResLang.textContent = sd.detectedLanguage
                ? `Detected: ${sd.detectedLanguage}`
                : subLangSel.options[subLangSel.selectedIndex].text;
              try {
                const txt = await (await fetch(sd.srtPath)).text();
                subSrtPrev.value = txt;
                if (detectGender && sd.genderSummary) {
                  renderGenderSummary(sd.genderSummary, sd.genderSegments || []);
                } else {
                  removeGenderSummary();
                }
              } catch {}
              subResSec.classList.remove('hidden');
              subTransSec.classList.remove('disabled-state');
              subBurnSec.classList.remove('disabled-state');
              subTtsSec && subTtsSec.classList.remove('disabled-state');
              toast(detectGender ? 'Subtitles generated with gender detection!' : 'Subtitles generated!');
              newBtn.disabled = false;
            } else if (sd.status === 'failed') {
              clearInterval(poll);
              throw new Error(sd.error || 'Transcription failed');
            }
          } catch (err) {
            clearInterval(poll);
            subProgSec.classList.add('hidden');
            subEmptyS.classList.remove('hidden');
            toast(err.message, 'error');
            newBtn.disabled = false;
          }
        }, 1000);
      } catch (e) {
        subProgSec.classList.add('hidden');
        subEmptyS.classList.remove('hidden');
        toast(e.message, 'error');
        newBtn.disabled = false;
      }
    });
  }

  function renderGenderSummary(summary, segments) {
    removeGenderSummary();
    const subResSec = $('subResultsSection');
    if (!subResSec) return;
    const card = document.createElement('div');
    card.className = 'gender-summary-card';
    card.id = 'genderSummaryCard';
    card.innerHTML = `
      <div class="gender-stat">
        <span class="gender-stat-icon">💙</span>
        <span class="gender-stat-count">${summary.male}</span>
        <span class="gender-stat-label">Male segments</span>
      </div>
      <div class="gender-stat">
        <span class="gender-stat-icon">💗</span>
        <span class="gender-stat-count">${summary.female}</span>
        <span class="gender-stat-label">Female segments</span>
      </div>
      ${summary.unknown > 0 ? `<div class="gender-stat">
        <span class="gender-stat-icon">❓</span>
        <span class="gender-stat-count">${summary.unknown}</span>
        <span class="gender-stat-label">Undetected</span>
      </div>` : ''}
    `;
    subResSec.insertBefore(card, subResSec.firstChild);
  }

  function removeGenderSummary() {
    const old = $('genderSummaryCard');
    if (old) old.remove();
  }

  let selectedTtsEngine = 'online';
  let selectedTtsSrc    = 'original';
  let currentTranslatedSrtPath = null;
  let currentTranslatedLang    = 'en';

  const ttsEngineOffline   = $('ttsEngineOffline');
  const ttsEngineOnline    = $('ttsEngineOnline');
  const ttsSrcOriginal     = $('ttsSrcOriginal');
  const ttsSrcTranslated   = $('ttsSrcTranslated');
  const ttsSpeedSlider     = $('ttsSpeedSlider');
  const ttsSpeedVal        = $('ttsSpeedVal');
  const subBtnTtsGenerate  = $('subBtnTtsGenerate');
  const subTtsProgress     = $('subTtsProgress');
  const subTtsProgressFill = $('subTtsProgressFill');
  const subTtsStatusText   = $('subTtsStatusText');
  const subTtsResult       = $('subTtsResult');
  const subTtsAudioPlayer  = $('subTtsAudioPlayer');
  const subTtsBtnDownload  = $('subTtsBtnDownload');

  [ttsEngineOffline, ttsEngineOnline].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      [ttsEngineOffline, ttsEngineOnline].forEach(b => b && b.classList.remove('active'));
      btn.classList.add('active');
      selectedTtsEngine = btn.dataset.engine;
    });
  });

  [ttsSrcOriginal, ttsSrcTranslated].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      [ttsSrcOriginal, ttsSrcTranslated].forEach(b => b && b.classList.remove('active'));
      btn.classList.add('active');
      selectedTtsSrc = btn.dataset.src;
      if (subBtnTtsGenerate) {
        subBtnTtsGenerate.textContent = selectedTtsSrc === 'translated'
          ? '🔊 GENERATE AUDIO FROM TRANSLATED SRT'
          : '🔊 GENERATE AUDIO FROM SRT';
      }
    });
  });

  if (ttsSpeedSlider) {
    ttsSpeedSlider.addEventListener('input', () => {
      ttsSpeedVal.textContent = `${parseFloat(ttsSpeedSlider.value).toFixed(2)}×`;
    });
  }

  async function runTts({ srtPath, engine, speed, lang, videoPath, onProgress, onDone, onError }) {
    const r = await fetch('/api/srt-to-audio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srtPath, engine, speed, lang, videoPath })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'TTS failed');

    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`/api/status/${d.batchId}`);
          const sd = await sr.json();
          if (sd.status === 'generating_audio') {
            onProgress && onProgress(sd.progress, sd.statusMessage);
          } else if (sd.status === 'completed') {
            clearInterval(poll);
            resolve(sd);
          } else if (sd.status === 'failed') {
            clearInterval(poll);
            reject(new Error(sd.error || 'TTS generation failed'));
          }
        } catch (err) {
          clearInterval(poll);
          reject(err);
        }
      }, 1000);
    });
  }

  if (subBtnTtsGenerate) {
    subBtnTtsGenerate.addEventListener('click', async () => {
      const useTranslated = selectedTtsSrc === 'translated';
      const srtToUse = useTranslated ? currentTranslatedSrtPath : currentSrtPath;

      if (!srtToUse) {
        toast(useTranslated
          ? 'Translate the SRT first (Step 03)'
          : 'Generate subtitles first (Step 01)', 'error');
        return;
      }

      const speed = ttsSpeedSlider ? parseFloat(ttsSpeedSlider.value) : 1.0;
      let lang;
      if (useTranslated) {
        lang = currentTranslatedLang || 'en';
      } else {
        const subLangSel = $('subLanguageSelect');
        const rawLang = subLangSel ? subLangSel.value : 'en-US';
        lang = rawLang === 'auto' ? 'en' : rawLang.split('-')[0];
      }

      subBtnTtsGenerate.disabled = true;
      subTtsResult.classList.add('hidden');
      subTtsProgress.classList.remove('hidden');
      subTtsProgressFill.style.width = '0%';
      subTtsStatusText.textContent = `Initializing ${selectedTtsEngine === 'online' ? 'Google' : 'System'} TTS (${lang})...`;

      try {
        const sd = await runTts({
          srtPath: srtToUse,
          engine: selectedTtsEngine,
          speed,
          lang,
          videoPath: subFilePath.value.trim(),
          onProgress: (pct, msg) => {
            subTtsProgressFill.style.width = `${pct}%`;
            subTtsStatusText.textContent = msg || `Generating audio: ${pct}%`;
          }
        });
        subTtsProgress.classList.add('hidden');
        subTtsAudioPlayer.src = sd.audioPath;
        subTtsAudioPlayer.load();
        subTtsBtnDownload.href = sd.audioPath;
        subTtsBtnDownload.download = sd.audioPath.split('/').pop();
        subTtsResult.classList.remove('hidden');
        toast('Audio generated! 🔊');
      } catch (e) {
        subTtsProgress.classList.add('hidden');
        toast(e.message, 'error');
      }
      subBtnTtsGenerate.disabled = false;
    });
  }

  const subBtnTranslatedAudio       = $('subBtnTranslatedAudio');
  const subTranslatedAudioProgress  = $('subTranslatedAudioProgress');
  const subTranslatedAudioFill      = $('subTranslatedAudioFill');
  const subTranslatedAudioStatus    = $('subTranslatedAudioStatus');
  const subTranslatedAudioResult    = $('subTranslatedAudioResult');
  const subTranslatedAudioPlayer    = $('subTranslatedAudioPlayer');
  const subTranslatedAudioDownload  = $('subTranslatedAudioDownload');

  if (subBtnTranslatedAudio) {
    subBtnTranslatedAudio.addEventListener('click', async () => {
      if (!currentTranslatedSrtPath) {
        toast('Translate the SRT first (Step 03)', 'error');
        return;
      }
      const lang = currentTranslatedLang || 'en';
      const speed = ttsSpeedSlider ? parseFloat(ttsSpeedSlider.value) : 1.0;

      subBtnTranslatedAudio.disabled = true;
      subTranslatedAudioResult.classList.add('hidden');
      subTranslatedAudioProgress.classList.remove('hidden');
      subTranslatedAudioFill.style.width = '0%';
      subTranslatedAudioStatus.textContent = `Generating ${lang.toUpperCase()} audio...`;

      try {
        const sd = await runTts({
          srtPath: currentTranslatedSrtPath,
          engine: selectedTtsEngine,
          speed,
          lang,
          videoPath: subFilePath.value.trim(),
          onProgress: (pct, msg) => {
            subTranslatedAudioFill.style.width = `${pct}%`;
            subTranslatedAudioStatus.textContent = msg || `Generating audio: ${pct}%`;
          }
        });
        subTranslatedAudioProgress.classList.add('hidden');
        subTranslatedAudioPlayer.src = sd.audioPath;
        subTranslatedAudioPlayer.load();
        subTranslatedAudioDownload.href = sd.audioPath;
        subTranslatedAudioDownload.download = sd.audioPath.split('/').pop();
        subTranslatedAudioResult.classList.remove('hidden');
        toast(`${lang.toUpperCase()} audio generated! 🔊`);
      } catch (e) {
        subTranslatedAudioProgress.classList.add('hidden');
        toast(e.message, 'error');
      }
      subBtnTranslatedAudio.disabled = false;
    });
  }

  const origTranslateBtn = $('subBtnTranslate');
  if (origTranslateBtn) {
    origTranslateBtn.addEventListener('click', () => {
      const obs = new MutationObserver(() => {
        const tSrtEl = $('subBtnDownloadTranslatedSrt');
        if (tSrtEl && tSrtEl.href && !tSrtEl.href.endsWith('#')) {
          currentTranslatedSrtPath = tSrtEl.getAttribute('href');
          const sel = $('subTargetLangSelect');
          currentTranslatedLang = sel ? sel.value.split('-')[0] : 'en';
          if (ttsSrcTranslated) {
            [ttsSrcOriginal, ttsSrcTranslated].forEach(b => b && b.classList.remove('active'));
            ttsSrcTranslated.classList.add('active');
            selectedTtsSrc = 'translated';
            if (subBtnTtsGenerate) subBtnTtsGenerate.textContent = '🔊 GENERATE AUDIO FROM TRANSLATED SRT';
          }
          obs.disconnect();
        }
      });
      const labelEl = $('subTranslatedLangLabel');
      if (labelEl) obs.observe(labelEl, { childList: true, subtree: true, characterData: true });
    }, { once: false });
  }
}
