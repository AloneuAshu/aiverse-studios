import { $, toast, fmtSec } from './utils.js';

export function initRandomGen() {
  const randomFilePath = $('randomFilePath');
  const randomBtnBrowse = $('randomBtnBrowse');
  const randomBtnProbe = $('randomBtnProbe');
  const randomProbeResult = $('randomProbeResult');
  const randomConfigSection = $('randomConfigSection');
  const randomMetaFileName = $('randomMetaFileName');
  const randomMetaDuration = $('randomMetaDuration');
  const randomMetaResolution = $('randomMetaResolution');
  const randomBtnGenerate = $('randomBtnGenerate');
  const randomProgressSection = $('randomProgressSection');
  const randomProgressFill = $('randomProgressFill');
  const randomStatusText = $('randomStatusText');
  const randomResultsSection = $('randomResultsSection');
  const randomResultsList = $('randomResultsList');
  const randomEmptyState = $('randomEmptyState');
  
  const randomProposedSection = $('randomProposedSection');
  const randomProposedList = $('randomProposedList');
  const randomPreviewPlayer = $('randomPreviewPlayer');
  const randomBtnStartRender = $('randomBtnStartRender');
  
  const randomPanSlider = $('randomPanSlider');
  const randomPanVal = $('randomPanVal');
  const randomPanAdjusterGroup = $('randomPanAdjusterGroup');
  
  const randomBtnRefreshLibrary = $('randomBtnRefreshLibrary');
  const randomLibraryList = $('randomLibraryList');
  
  const randomTimelineContainer = $('randomTimelineContainer');
  const randomTimelineTrack = $('randomTimelineTrack');
  const randomTimelineDurationLabel = $('randomTimelineDurationLabel');
  
  let randomMediaInfo = null;
  let selectedDuration = 5;
  let proposedClips = [];
  let currentPreviewIndex = 0;

  let manualQueue = [];
  let manualStartSec = null;
  let manualDurSec = 5;
  let manualMediaPath = null;
  let manualPanValue = 0;
  let selectedQueueIndex = -1;

  const durBtns = document.querySelectorAll('.random-dur-btn');
  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDuration = parseInt(btn.dataset.duration);
    });
  });

  randomBtnBrowse.addEventListener('click', async () => {
    randomBtnBrowse.textContent = '…';
    randomBtnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Browse failed');
      if (d.filePath) {
        randomFilePath.value = d.filePath;
        toast('File selected');
      }
    } catch (e) {
      console.error('[BROWSE] Error:', e);
      toast(e.message || 'Failed to open file browser', 'error');
    }
    randomBtnBrowse.textContent = 'BROWSE';
    randomBtnBrowse.disabled = false;
  });

  randomBtnProbe.addEventListener('click', async () => {
    const fp = randomFilePath.value.trim();
    if (!fp) {
      toast('Please enter a file path', 'error');
      return;
    }
    
    randomBtnProbe.textContent = 'ANALYZING…';
    randomBtnProbe.disabled = true;
    
    try {
      const r = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fp })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      
      randomMediaInfo = d;
      randomMetaFileName.textContent = d.fileName;
      randomMetaDuration.textContent = fmtSec(d.duration);
      randomMetaResolution.textContent = `${d.width}×${d.height}`;
      
      randomProbeResult.classList.remove('hidden');
      randomConfigSection.classList.remove('disabled-state');
      activateManualCutter(fp, d.duration);
      toast('Video analyzed successfully');
    } catch (e) {
      toast(e.message || 'Failed to analyze video', 'error');
    } finally {
      randomBtnProbe.textContent = 'ANALYZE';
      randomBtnProbe.disabled = false;
    }
  });

  randomFilePath.addEventListener('keydown', e => {
    if (e.key === 'Enter') randomBtnProbe.click();
  });

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${ms}`;
  }

  function activateManualCutter(filePath, duration) {
    manualMediaPath = filePath;
    const section = $('randomManualSection');
    const player = $('manualPreviewPlayer');
    const scrubber = $('manualScrubber');
    const timeDisplay = $('manualCurrentTime');

    section.classList.remove('disabled-state');
    player.src = '/api/serve-video?path=' + encodeURIComponent(filePath);
    scrubber.max = duration;
    scrubber.step = 0.5;
    scrubber.value = 0;
    timeDisplay.textContent = '00:00:00.0';

    player.addEventListener('loadeddata', () => {
      const ph = $('manualCropPreviewPlaceholder');
      if (ph) ph.style.display = 'none';
      updateCropVisualization(0);
    });

    scrubber.addEventListener('input', () => {
      player.currentTime = parseFloat(scrubber.value);
      timeDisplay.textContent = fmtTime(player.currentTime);
    });
    player.addEventListener('timeupdate', () => {
      if (!scrubber.matches(':active')) {
        scrubber.value = player.currentTime;
        timeDisplay.textContent = fmtTime(player.currentTime);
      }
    });
    player.addEventListener('seeked', () => {
      const pan = (selectedQueueIndex === -1) ? manualPanValue : (manualQueue[selectedQueueIndex] ? manualQueue[selectedQueueIndex].pan : 0);
      updateCropVisualization(pan);
    });
  }

  const manualAlignLabel = $('manualAlignLabel');
  const manualSnapL      = $('manualSnapL');
  const manualSnapC      = $('manualSnapC');
  const manualSnapR      = $('manualSnapR');

  function updateAlignStationUI(pan) {
    if (!randomPanSlider || !randomPanVal || !manualAlignLabel) return;
    
    randomPanSlider.value = pan;

    if (Math.abs(pan) < 0.05) {
      randomPanVal.textContent = 'Center';
      randomPanVal.style.color = 'var(--accent-purple)';
      randomPanVal.style.background = 'rgba(168,85,247,0.1)';
    } else if (pan < 0) {
      randomPanVal.textContent = `Left ${Math.abs(Math.round(pan * 100))}%`;
      randomPanVal.style.color = 'var(--accent-cyan)';
      randomPanVal.style.background = 'rgba(6,182,212,0.1)';
    } else {
      randomPanVal.textContent = `Right ${Math.round(pan * 100)}%`;
      randomPanVal.style.color = 'var(--accent-cyan)';
      randomPanVal.style.background = 'rgba(6,182,212,0.1)';
    }

    if (selectedQueueIndex === -1) {
      manualAlignLabel.textContent = '↔ CROP ALIGNMENT (NEW CLIP)';
      manualAlignLabel.style.color = 'var(--accent-cyan)';
    } else {
      manualAlignLabel.textContent = `↔ CROP ALIGNMENT (EDITING CLIP #${selectedQueueIndex + 1})`;
      manualAlignLabel.style.color = 'var(--accent-purple)';
    }

    manualSnapL.classList.toggle('active-cyan', pan <= -0.9);
    manualSnapC.classList.toggle('active-purple', Math.abs(pan) < 0.12);
    manualSnapR.classList.toggle('active-cyan', pan >= 0.9);

    updateCropVisualization(pan);
  }

  function handleAlignmentChange(pan) {
    if (selectedQueueIndex === -1) {
      manualPanValue = pan;
    } else {
      if (manualQueue[selectedQueueIndex]) {
        manualQueue[selectedQueueIndex].pan = pan;
        const itemEl = document.querySelectorAll('.manual-queue-item')[selectedQueueIndex];
        if (itemEl) {
          const badge = itemEl.querySelector('.mqi-align-badge');
          if (badge) {
            const isCenter = Math.abs(pan) < 0.05;
            badge.className = `mqi-align-badge ${isCenter ? '' : (pan < 0 ? 'left-aligned' : 'right-aligned')}`;
            badge.textContent = isCenter ? '⊙ Center' : (pan < 0 ? `◀ L ${Math.abs(Math.round(pan * 100))}%` : `R ${Math.round(pan * 100)}% ▶`);
          }
        }
      }
    }
    updateAlignStationUI(pan);
  }

  if (randomPanSlider) {
    randomPanSlider.addEventListener('input', () => {
      handleAlignmentChange(parseFloat(randomPanSlider.value));
    });
    randomPanSlider.addEventListener('dblclick', () => {
      handleAlignmentChange(0);
      toast('Crop aligned to Center');
    });
  }

  if (manualSnapL) {
    manualSnapL.addEventListener('click', () => {
      handleAlignmentChange(-1);
      toast('Aligned to Left edge');
    });
  }
  if (manualSnapC) {
    manualSnapC.addEventListener('click', () => {
      handleAlignmentChange(0);
      toast('Aligned to Center');
    });
  }
  if (manualSnapR) {
    manualSnapR.addEventListener('click', () => {
      handleAlignmentChange(1);
      toast('Aligned to Right edge');
    });
  }

  const manualBtnSetStart = $('manualBtnSetStart');
  if (manualBtnSetStart) {
    manualBtnSetStart.addEventListener('click', () => {
      const player = $('manualPreviewPlayer');
      if (!player.src || player.src === window.location.href) {
        toast('Analyze a video first', 'error'); return;
      }
      manualStartSec = player.currentTime;
      $('manualStartDisplay').textContent = fmtTime(manualStartSec);
      manualBtnSetStart.textContent = '✅ START SET';
      setTimeout(() => { manualBtnSetStart.textContent = '📍 SET START'; }, 1200);
      toast(`Start set: ${fmtTime(manualStartSec)}`);
    });
  }

  const manualDurBtns = document.querySelectorAll('.manual-dur-btn');
  manualDurBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      manualDurBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      manualDurSec = parseInt(btn.dataset.dur);
    });
  });

  const manualBtnAddClip = $('manualBtnAddClip');
  if (manualBtnAddClip) {
    manualBtnAddClip.addEventListener('click', () => {
      if (manualStartSec === null) {
        toast('Set a START POINT first using the scrubber', 'error'); return;
      }
      if (!manualMediaPath) {
        toast('Analyze a video first', 'error'); return;
      }
      manualQueue.push({ start: manualStartSec, duration: manualDurSec, pan: manualPanValue });
      selectedQueueIndex = manualQueue.length - 1;
      renderManualQueue();
      updateAlignStationUI(manualQueue[selectedQueueIndex].pan);
      toast(`Clip #${manualQueue.length} added & selected for alignment!`);
    });
  }

  const manualBtnClearQueue = $('manualBtnClearQueue');
  if (manualBtnClearQueue) {
    manualBtnClearQueue.addEventListener('click', () => {
      manualQueue = [];
      selectedQueueIndex = -1;
      updateAlignStationUI(0);
      renderManualQueue();
    });
  }

  function renderManualQueue() {
    const list = $('manualQueueList');
    const wrapper = $('manualQueueWrapper');
    const countEl = $('manualQueueCount');
    const renderCountEl = $('manualRenderCount');
    if (!list) return;

    countEl.textContent = manualQueue.length;
    renderCountEl.textContent = manualQueue.length;

    if (manualQueue.length === 0) {
      wrapper.classList.add('hidden');
      list.innerHTML = '';
      return;
    }
    wrapper.classList.remove('hidden');
    list.innerHTML = '';

    manualQueue.forEach((clip, i) => {
      const item = document.createElement('div');
      const isSelected = (i === selectedQueueIndex);
      item.className = `manual-queue-item ${isSelected ? 'selected' : ''}`;
      
      const panVal = clip.pan || 0;
      const isCenter = Math.abs(panVal) < 0.05;
      const alignText = isCenter ? '⊙ Center' : (panVal < 0 ? `◀ L ${Math.abs(Math.round(panVal * 100))}%` : `R ${Math.round(panVal * 100)}% ▶`);
      const alignClass = isCenter ? '' : (panVal < 0 ? 'left-aligned' : 'right-aligned');

      item.innerHTML = `
        <span class="mqi-index">#${i + 1}</span>
        <span class="mqi-info">${fmtTime(clip.start)}</span>
        <span class="mqi-dur">${clip.duration}s</span>
        <span class="mqi-align-badge ${alignClass}">${alignText}</span>
        <button class="mqi-preview" title="Preview clip">▶ Play</button>
        <button class="mqi-remove" title="Remove">✕</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.mqi-remove') || e.target.closest('.mqi-preview')) return;
        selectedQueueIndex = i;
        document.querySelectorAll('.manual-queue-item').forEach(row => row.classList.remove('selected'));
        item.classList.add('selected');

        const player = $('manualPreviewPlayer');
        const scrubber = $('manualScrubber');
        player.currentTime = clip.start;
        scrubber.value = clip.start;
        $('manualCurrentTime').textContent = fmtTime(clip.start);
        updateAlignStationUI(clip.pan);
        toast(`Editing alignment for Clip #${i+1}`);
      });

      item.querySelector('.mqi-preview').addEventListener('click', (e) => {
        e.stopPropagation();
        selectedQueueIndex = i;
        document.querySelectorAll('.manual-queue-item').forEach(row => row.classList.remove('selected'));
        item.classList.add('selected');
        updateAlignStationUI(clip.pan);

        const player  = $('manualPreviewPlayer');
        const scrubber = $('manualScrubber');
        player.currentTime = clip.start;
        scrubber.value = clip.start;
        $('manualCurrentTime').textContent = fmtTime(clip.start);
        
        player.play();
        setTimeout(() => player.pause(), clip.duration * 1000);
      });

      item.querySelector('.mqi-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        manualQueue.splice(i, 1);
        if (selectedQueueIndex === i) {
          selectedQueueIndex = -1;
          updateAlignStationUI(0);
        } else if (selectedQueueIndex > i) {
          selectedQueueIndex--;
        }
        renderManualQueue();
      });

      list.appendChild(item);
    });
  }

  function updateCropVisualization(pan) {
    if (!randomMediaInfo) return;

    const video      = $('manualPreviewPlayer');
    const overlayC   = $('manualCropOverlay');
    const previewC   = $('manualCropPreview');
    if (!overlayC || !previewC) return;

    const srcW = randomMediaInfo.width;
    const srcH = randomMediaInfo.height;

    let cropW, cropH, cropY;
    if (srcW > srcH) {
      cropH = srcH;
      cropW = Math.round((srcH * 9) / 16);
      cropY = 0;
    } else {
      cropW = srcW; cropH = srcH; cropY = 0;
    }
    cropW = Math.round(cropW / 2) * 2;
    cropH = Math.round(cropH / 2) * 2;

    const maxCropX = Math.max(0, srcW - cropW);
    const centerX  = Math.round(maxCropX / 2);
    let cropX;
    if (pan < 0) {
      cropX = Math.round(centerX * (1 + pan));
    } else {
      cropX = Math.round(centerX + pan * (maxCropX - centerX));
    }
    cropX = Math.max(0, Math.min(maxCropX, cropX));

    const cW = overlayC.offsetWidth;
    const cH = overlayC.offsetHeight;
    overlayC.width  = cW;
    overlayC.height = cH;
    const ctx = overlayC.getContext('2d');
    ctx.clearRect(0, 0, cW, cH);

    const aspect = srcW / srcH;
    let vW = cW, vH = cW / aspect;
    if (vH > cH) { vH = cH; vW = cH * aspect; }
    const vX = (cW - vW) / 2;
    const vY = (cH - vH) / 2;

    const dLeft = vX + (cropX / srcW) * vW;
    const dCropW = (cropW / srcW) * vW;

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(vX, vY, dLeft - vX, vH);
    ctx.fillRect(dLeft + dCropW, vY, (vX + vW) - (dLeft + dCropW), vH);

    ctx.strokeStyle = 'rgba(6,182,212,0.95)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dLeft + 1, vY + 1, dCropW - 2, vH - 2);

    const mark = 8;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#fff';
    [[dLeft+1, vY+1], [dLeft+dCropW-1, vY+1], [dLeft+1, vY+vH-1], [dLeft+dCropW-1, vY+vH-1]].forEach(([x,y]) => {
      const dx = x < dLeft + dCropW/2 ? 1 : -1;
      const dy = y < vY + vH/2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x + dx*mark, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy*mark);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(6,182,212,0.85)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('9:16', dLeft + dCropW/2, vY + vH - 6);

    if (video.readyState >= 2) {
      const pCtx = previewC.getContext('2d');
      pCtx.clearRect(0, 0, previewC.width, previewC.height);
      try {
        pCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, previewC.width, previewC.height);
      } catch(e) {}

      const grad = pCtx.createRadialGradient(
        previewC.width/2, previewC.height/2, previewC.height*0.3,
        previewC.width/2, previewC.height/2, previewC.height*0.8
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.25)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, previewC.width, previewC.height);
    }
  }

  const manualBtnRender = $('manualBtnRender');
  if (manualBtnRender) {
    manualBtnRender.addEventListener('click', async () => {
      if (manualQueue.length === 0) { toast('Queue is empty', 'error'); return; }
      if (!manualMediaPath) { toast('No video selected', 'error'); return; }
      if (!randomMediaInfo) { toast('Analyze a video first', 'error'); return; }

      const format = $('manualFormat').value;
      const fitMode = $('manualFitMode').value;
      const progSection = $('manualProgressSection');
      const progFill = $('manualProgressFill');
      const statusText = $('manualStatusText');

      const srcW = randomMediaInfo.width;
      const srcH = randomMediaInfo.height;
      let baseCropW, baseCropH, baseCropY, maxCropX;
      if (srcW > srcH) {
        baseCropH = srcH;
        baseCropW = Math.round((srcH * 9) / 16);
        baseCropY = 0;
        maxCropX = srcW - baseCropW;
      } else {
        baseCropW = srcW;
        baseCropH = srcH;
        baseCropY = 0;
        maxCropX = 0;
      }
      baseCropW = Math.round(baseCropW / 2) * 2;
      baseCropH = Math.round(baseCropH / 2) * 2;

      manualBtnRender.disabled = true;
      progSection.classList.remove('hidden');

      let completedClips = [];
      const total = manualQueue.length;

      for (let i = 0; i < total; i++) {
        const clip = manualQueue[i];
        statusText.textContent = `Rendering clip ${i + 1} of ${total}…`;
        progFill.style.width = `${Math.round((i / total) * 100)}%`;

        const clipPan = clip.pan || 0;
        const centerX = Math.round((srcW - baseCropW) / 2);
        let clipCropX;
        if (clipPan < 0) {
          clipCropX = Math.round(centerX * (1 + clipPan));
        } else {
          clipCropX = Math.round(centerX + clipPan * (maxCropX - centerX));
        }
        clipCropX = Math.max(0, Math.min(maxCropX, clipCropX));

        try {
          const r = await fetch('/api/crop-render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: manualMediaPath,
              startSec: clip.start,
              duration: clip.duration,
              cropX: clipCropX,
              cropY: baseCropY,
              cropW: baseCropW,
              cropH: baseCropH,
              fitMode,
              format
            })
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'Render failed');

          await new Promise((resolve, reject) => {
            const poll = setInterval(async () => {
              try {
                const sr = await fetch(`/api/status/${d.batchId}`);
                const sd = await sr.json();
                if (sd.status === 'completed') {
                  clearInterval(poll);
                  const job = sd.jobs && sd.jobs[0];
                  if (job && job.outputPath) {
                    completedClips.push({
                      url: job.outputPath,
                      thumb: job.thumbnailPath,
                      name: job.outputFileName || `manual_clip_${i + 1}.mp4`
                    });
                  }
                  resolve();
                } else if (sd.status === 'failed') {
                  clearInterval(poll);
                  const job = sd.jobs && sd.jobs[0];
                  reject(new Error((job && job.error) || 'Clip render failed'));
                } else {
                  const job = sd.jobs && sd.jobs[0];
                  const jobPct = (job && job.progress) || 0;
                  const base = (i / total) * 100;
                  const sub = (jobPct / 100) * (100 / total);
                  progFill.style.width = `${Math.round(base + sub)}%`;
                }
              } catch (err) {
                clearInterval(poll);
                reject(err);
              }
            }, 800);
          });
        } catch (err) {
          toast(`Clip ${i + 1} failed: ${err.message}`, 'error');
        }
      }

      progFill.style.width = '100%';
      statusText.textContent = `Done! ${completedClips.length} clip(s) exported.`;

      if (completedClips.length > 0) {
        const resultsSection = $('randomResultsSection');
        const resultsList = $('randomResultsList');
        $('randomEmptyState').classList.add('hidden');
        resultsSection.classList.remove('hidden');
        completedClips.forEach(clip => {
          const card = document.createElement('div');
          card.className = 'result-item';
          const thumb = clip.thumb ? `<img src="${clip.thumb}" style="width:40px;height:72px;object-fit:cover;border-radius:4px;flex-shrink:0;">` : '';
          card.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.6rem;">
              ${thumb}
              <span class="result-name">${clip.name}</span>
            </div>
            <div class="result-actions">
              <a href="${clip.url}" target="_blank" class="proposed-btn preview-btn">▶ Play</a>
              <a href="${clip.url}" download class="proposed-btn">⬇ Save</a>
            </div>
          `;
          resultsList.prepend(card);
        });
        toast(`${completedClips.length} manual clip(s) rendered!`);
      }

      setTimeout(() => progSection.classList.add('hidden'), 3000);
      manualBtnRender.disabled = false;
      randomBtnRefreshLibrary.click();
    });
  }

  function updatePanSliderLabel(pan) {
    if (Math.abs(pan) < 0.01) {
      randomPanVal.textContent = 'Center';
    } else if (pan < 0) {
      randomPanVal.textContent = `Left ${Math.abs(Math.round(pan * 100))}%`;
    } else {
      randomPanVal.textContent = `Right ${Math.round(pan * 100)}%`;
    }
  }

  function applyPreviewPan(pan) {
    if (!randomMediaInfo || !randomMediaInfo.height) return;
    const containerH = 240;
    const containerW = 135;
    const aspect = randomMediaInfo.width / randomMediaInfo.height;
    const videoW = containerH * aspect;
    const maxShift = (videoW - containerW) / 2;
    const tx = -maxShift * (1 + pan);
    randomPreviewPlayer.style.transform = `translateX(${tx}px)`;
  }

  if (randomPanSlider) {
    randomPanSlider.addEventListener('input', () => {
      const pan = parseFloat(randomPanSlider.value);
      updatePanSliderLabel(pan);
      if (proposedClips[currentPreviewIndex]) {
        proposedClips[currentPreviewIndex].pan = pan;
      }
      applyPreviewPan(pan);
    });
  }

  const randomFitMode = $('randomFitMode');
  if (randomFitMode) {
    randomFitMode.addEventListener('change', () => {
      if (proposedClips.length > 0) {
        previewProposedClip(currentPreviewIndex);
      }
    });
  }

  function previewProposedClip(index) {
    currentPreviewIndex = index;
    updateRandomTimeline();
    const clip = proposedClips[index];
    if (!clip) return;

    const items = randomProposedList.querySelectorAll('.proposed-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active-preview');
      } else {
        item.classList.remove('active-preview');
      }
    });

    const fitMode = $('randomFitMode').value;
    if (fitMode === 'crop') {
      randomPanAdjusterGroup.style.display = 'block';
      randomPanSlider.value = clip.pan || 0;
      updatePanSliderLabel(clip.pan || 0);
      applyPreviewPan(clip.pan || 0);
    } else {
      randomPanAdjusterGroup.style.display = 'none';
      randomPreviewPlayer.style.transform = 'none';
    }

    const filePath = randomFilePath.value.trim();
    const targetSrc = `/api/video-stream?filePath=${encodeURIComponent(filePath)}`;
    const norm = p => p ? p.replace(/\\/g, '/').toLowerCase() : '';

    let isSameVideo = false;
    try {
      if (randomPreviewPlayer.src) {
        const url = new URL(randomPreviewPlayer.src, window.location.href);
        const loadedPath = url.searchParams.get('filePath');
        isSameVideo = (norm(loadedPath) === norm(filePath));
      }
    } catch (err) {
      console.error('[Preview] Failed to parse player URL:', err);
    }

    const startPlay = () => {
      randomPreviewPlayer.currentTime = clip.start;
      randomPreviewPlayer.play().catch(() => {});
      if (fitMode === 'crop') {
        applyPreviewPan(clip.pan || 0);
      }
    };

    if (!randomPreviewPlayer._onTimeUpdateBound) {
      randomPreviewPlayer._onTimeUpdateBound = true;
      randomPreviewPlayer.addEventListener('timeupdate', () => {
        if (randomPreviewPlayer.seeking) return;
        const activeClip = proposedClips[currentPreviewIndex];
        if (!activeClip) return;
        if (randomPreviewPlayer.currentTime >= activeClip.end || randomPreviewPlayer.currentTime < activeClip.start) {
          randomPreviewPlayer.currentTime = activeClip.start;
        }
      });
    }

    if (isSameVideo && randomPreviewPlayer.readyState >= 1) {
      startPlay();
    } else {
      randomPreviewPlayer.src = targetSrc;
      randomPreviewPlayer.addEventListener('loadedmetadata', startPlay, { once: true });
      randomPreviewPlayer.load();
    }
  }

  function rollClip(index) {
    const minGap = parseFloat($('randomMinGap').value) || 2;
    const maxStart = randomMediaInfo.duration - selectedDuration;
    let start;
    let attempts = 0;
    let valid = false;

    while (!valid && attempts < 200) {
      start = Math.random() * maxStart;
      valid = true;
      for (let i = 0; i < proposedClips.length; i++) {
        if (i === index) continue;
        if (Math.abs(start - proposedClips[i].start) < (selectedDuration + minGap)) {
          valid = false;
          break;
        }
      }
      attempts++;
    }

    if (valid) {
      proposedClips[index] = {
        start: parseFloat(start.toFixed(3)),
        duration: selectedDuration,
        end: parseFloat((start + selectedDuration).toFixed(3)),
        checked: true
      };
      renderProposedList();
      previewProposedClip(index);
      toast(`Re-rolled clip #${index + 1}`);
    } else {
      toast('Could not re-roll a valid clip. Try reducing the min gap setting.', 'error');
    }
  }

  function renderProposedList() {
    randomProposedList.innerHTML = '';
    proposedClips.forEach((clip, index) => {
      const item = document.createElement('div');
      item.className = 'proposed-item';
      if (randomPreviewPlayer.src && Math.abs(randomPreviewPlayer.currentTime - clip.start) < 0.1) {
        item.classList.add('active-preview');
      }
      
      item.innerHTML = `
        <div class="proposed-left">
          <input type="checkbox" class="proposed-checkbox" ${clip.checked ? 'checked' : ''}>
          <span class="proposed-index">#${index + 1}</span>
          <span class="proposed-time">${fmtSec(clip.start)} - ${fmtSec(clip.end)}</span>
        </div>
        <div class="proposed-right">
          <button class="proposed-btn preview-btn">👁 Preview</button>
          <button class="proposed-btn reroll-btn">🎲 Re-roll</button>
        </div>
      `;

      const checkbox = item.querySelector('.proposed-checkbox');
      checkbox.addEventListener('change', () => {
        clip.checked = checkbox.checked;
        updateRandomTimeline();
      });

      const previewBtn = item.querySelector('.preview-btn');
      previewBtn.addEventListener('click', () => {
        previewProposedClip(index);
      });

      const rerollBtn = item.querySelector('.reroll-btn');
      rerollBtn.addEventListener('click', () => {
        rollClip(index);
      });

      randomProposedList.appendChild(item);
    });
    updateRandomTimeline();
  }

  function updateRandomTimeline() {
    if (!randomMediaInfo || !proposedClips.length) {
      randomTimelineContainer.classList.add('hidden');
      return;
    }
    randomTimelineContainer.classList.remove('hidden');
    
    const totalSec = randomMediaInfo.duration;
    randomTimelineDurationLabel.textContent = fmtSec(totalSec);
    randomTimelineTrack.innerHTML = '';
    
    proposedClips.forEach((clip, index) => {
      const block = document.createElement('div');
      const leftPct = (clip.start / totalSec) * 100;
      const widthPct = (clip.duration / totalSec) * 100;
      
      block.style.position = 'absolute';
      block.style.left = `${leftPct}%`;
      block.style.width = `${widthPct}%`;
      block.style.height = '100%';
      block.style.top = '0';
      
      const isChecked = clip.checked !== false;
      const isActive = index === currentPreviewIndex;
      
      if (isActive) {
        block.style.background = 'rgba(6, 182, 212, 0.4)';
        block.style.border = '2px solid var(--accent-cyan)';
        block.style.boxShadow = '0 0 8px rgba(6, 182, 212, 0.5)';
      } else if (isChecked) {
        block.style.background = 'rgba(168, 85, 247, 0.3)';
        block.style.border = '1px solid var(--accent-purple)';
      } else {
        block.style.background = 'rgba(255, 255, 255, 0.06)';
        block.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
      }
      
      block.style.borderRadius = '3px';
      block.style.cursor = 'pointer';
      block.style.transition = 'all 0.15s ease';
      block.title = `Clip #${index + 1}: ${fmtSec(clip.start)} - ${fmtSec(clip.end)}`;
      
      block.addEventListener('click', (e) => {
        e.stopPropagation();
        previewProposedClip(index);
      });
      
      randomTimelineTrack.appendChild(block);
    });
  }

  randomBtnGenerate.addEventListener('click', () => {
    if (!randomMediaInfo) {
      toast('Please analyze a video first', 'error');
      return;
    }

    const clipCount = parseInt($('randomClipCount').value);
    const minGap = parseFloat($('randomMinGap').value);

    if (clipCount < 1 || clipCount > 100) {
      toast('Please enter a valid clip count (1-100)', 'error');
      return;
    }

    proposedClips = [];
    const maxStart = randomMediaInfo.duration - selectedDuration;
    
    for (let i = 0; i < clipCount; i++) {
      let start;
      let attempts = 0;
      let valid = false;
      
      while (!valid && attempts < 150) {
        start = Math.random() * maxStart;
        valid = true;
        for (const clip of proposedClips) {
          if (Math.abs(start - clip.start) < (selectedDuration + minGap)) {
            valid = false;
            break;
          }
        }
        attempts++;
      }
      
      if (valid) {
        proposedClips.push({
          start: parseFloat(start.toFixed(3)),
          duration: selectedDuration,
          end: parseFloat((start + selectedDuration).toFixed(3)),
          checked: true
        });
      }
    }

    if (proposedClips.length === 0) {
      toast('Could not generate valid clips with current settings', 'error');
      return;
    }

    randomProposedSection.classList.remove('hidden');
    randomProgressSection.classList.add('hidden');
    randomResultsSection.classList.add('hidden');
    randomEmptyState.classList.add('hidden');

    renderProposedList();
    previewProposedClip(0);
    toast(`Rolled ${proposedClips.length} clips for your review`);
  });

  randomBtnStartRender.addEventListener('click', async () => {
    const selected = proposedClips.filter(c => c.checked);
    if (selected.length === 0) {
      toast('Please select at least one clip to generate', 'error');
      return;
    }

    const format = $('randomFormat').value;
    const fitMode = $('randomFitMode').value;
    const filePath = randomFilePath.value.trim();

    randomPreviewPlayer.pause();

    randomProposedSection.classList.add('hidden');
    randomProgressSection.classList.remove('hidden');
    randomResultsSection.classList.add('hidden');
    randomProgressFill.style.width = '0%';
    randomStatusText.textContent = `Generating ${selected.length} clips...`;

    const results = [];
    const folderName = `${selectedDuration}s`;
    
    for (let i = 0; i < selected.length; i++) {
      const clip = selected[i];
      randomStatusText.textContent = `Generating clip ${i + 1}/${selected.length} (${clip.start.toFixed(1)}s)...`;
      randomProgressFill.style.width = `${((i + 1) / selected.length) * 100}%`;

      let cropW, cropH, cropX, cropY;
      if (fitMode === 'crop') {
        cropH = randomMediaInfo.height;
        cropW = Math.round(randomMediaInfo.height * (9 / 16) / 2) * 2;
        const maxPan = (randomMediaInfo.width - cropW) / 2;
        const panVal = clip.pan || 0;
        cropX = Math.round((randomMediaInfo.width - cropW) / 2 + panVal * maxPan);
        cropX = Math.round(cropX / 2) * 2;
        cropY = 0;
      } else {
        cropW = randomMediaInfo.width;
        cropH = randomMediaInfo.height;
        cropX = 0;
        cropY = 0;
      }

      try {
        const r = await fetch('/api/crop-render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath,
            startSec: clip.start,
            duration: clip.duration,
            cropX,
            cropY,
            cropW,
            cropH,
            srcW: randomMediaInfo.width,
            srcH: randomMediaInfo.height,
            fitMode,
            format,
            outputFolder: folderName
          })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        
        results.push({
          index: i + 1,
          start: clip.start,
          duration: clip.duration,
          batchId: d.batchId,
          status: 'processing'
        });
      } catch (e) {
        console.error(`Failed to generate clip ${i + 1}:`, e);
        results.push({
          index: i + 1,
          start: clip.start,
          duration: clip.duration,
          error: e.message
        });
      }
    }

    for (const result of results) {
      if (result.batchId) {
        try {
          await pollRandomRender(result.batchId);
          result.status = 'completed';
        } catch (e) {
          result.status = 'failed';
          result.error = e.message;
        }
      }
    }

    randomProgressSection.classList.add('hidden');
    randomResultsSection.classList.remove('hidden');
    randomResultsList.innerHTML = '';
    
    results.forEach(result => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = `
        <div class="result-meta">
          <span class="result-index">#${result.index}</span>
          <span class="result-time">${result.start.toFixed(1)}s - ${(result.start + result.duration).toFixed(1)}s</span>
        </div>
        <span class="result-status ${result.status === 'completed' ? 'success' : 'error'}">
          ${result.status === 'completed' ? '✅' : '❌'}
        </span>
      `;
      randomResultsList.appendChild(div);
    });

    toast(`Generated ${results.filter(r => r.status === 'completed').length}/${results.length} clips in ${folderName} folder`);
    loadLibrary();
  });

  async function loadLibrary() {
    try {
      const r = await fetch('/api/list-shorts');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      randomLibraryList.innerHTML = '';
      if (!d.shorts || d.shorts.length === 0) {
        randomLibraryList.innerHTML = `
          <div class="cyber-dim" style="font-size: 0.7rem; text-align: center; padding: 1rem 0;">No archived clips found. Generate some first!</div>
        `;
        return;
      }

      d.shorts.forEach(short => {
        const item = document.createElement('div');
        item.className = 'proposed-item';
        item.style.borderColor = 'rgba(168, 85, 247, 0.15)';
        
        item.innerHTML = `
          <div class="proposed-left" style="gap: 0.6rem;">
            <span class="proposed-index" style="color: var(--accent-purple); font-size: 0.65rem; padding: 2px 5px; background: rgba(168, 85, 247, 0.12); border-radius: 4px;">${short.folder}</span>
            <span style="font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; word-break: break-all; color: #fff;">${short.fileName}</span>
          </div>
          <div class="proposed-right">
            <a href="${short.url}" target="_blank" class="proposed-btn preview-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 2px; background: rgba(6, 182, 212, 0.12); color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.25);">▶ Play</a>
          </div>
        `;
        randomLibraryList.appendChild(item);
      });
    } catch (e) {
      console.error('[LIBRARY] Load error:', e);
      randomLibraryList.innerHTML = `
        <div class="cyber-dim" style="font-size: 0.7rem; text-align: center; padding: 1rem 0; color: #ef4444;">Failed to load library: ${e.message}</div>
      `;
    }
  }

  if (randomBtnRefreshLibrary) {
    randomBtnRefreshLibrary.addEventListener('click', loadLibrary);
  }

  loadLibrary();
}

async function pollRandomRender(batchId) {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/status/${batchId}`);
        const d = await r.json();
        if (d.status === 'completed') {
          clearInterval(poll);
          resolve(d);
        } else if (d.status === 'failed') {
          clearInterval(poll);
          reject(new Error(d.error || 'Render failed'));
        }
      } catch (e) {
        clearInterval(poll);
        reject(e);
      }
    }, 500);
  });
}
