import { $, toast, fmtSec, fmtDate } from './utils.js';

let state = {
  filePath:        '',
  mediaInfo:       null,
  currentClips:    [],
  selectedRatio:   'vertical',
  selectedFit:     'blur',
  selectedVibe:    'cinematic',
  batchCount:      1,
  volume:          1.0,
  activeBatchId:   null,
  pollInterval:    null,
  useTemplate:     false,
  templateMidFile: null,
  templateEndFile: null,
  templateMidDuration: 3,
  templateEndDuration: 3,
  mode:            'automatic', // "automatic" or "manual"
  manualClips:     [],
  activeCutIndex:  0,
  fadeDuration:    0.5,
};

let tooltipThumbTimer = null;
let thumbDebounceTimers = {};

export function initBatchGen() {
  const filePathInput       = $('filePath');
  const btnBrowse           = $('btnBrowse');
  const btnProbe            = $('btnProbe');
  const probeResultCard     = $('probeResult');
  const metaFileName        = $('metaFileName');
  const metaSize            = $('metaSize');
  const metaDuration        = $('metaDuration');
  const metaResolution      = $('metaResolution');
  const mediaTypeBadge      = $('mediaTypeBadge');
  const inputThumbWrap      = $('inputThumbnailWrapper');
  const inputThumb          = $('inputThumbnail');
  const configSection       = $('configSection');
  
  const toggleTemplate      = $('toggleTemplate');
  const templatePanel       = $('templatePanel');
  const templateFolderPath  = $('templateFolderPath');
  const btnBrowseFolder     = $('btnBrowseFolder');
  const btnScanTemplate     = $('btnScanTemplate');
  const templateCards       = $('templateCards');
  const midFileName         = $('midFileName');
  const midDuration         = $('midDuration');
  const endFileName         = $('endFileName');
  const endDuration         = $('endDuration');
  const midSecs             = $('midSecs');
  const endSecs             = $('endSecs');
  const structureVis        = $('structureVis');
  const stMidLabel          = $('stMidLabel');
  const stEndLabel          = $('stEndLabel');
  const stRand1             = $('stRand1');
  const stRand2             = $('stRand2');
  const stMid               = $('stMid');
  const stEnd               = $('stEnd');
  
  const btnModeAuto         = $('btnModeAuto');
  const btnModeManual       = $('btnModeManual');
  const manualClipsPanel    = $('manualClipsPanel');
  const vibeConfigGroup     = $('vibeConfigGroup');
  const clipListContainer   = $('clipListContainer');
  
  const btnReroll           = $('btnReroll');
  const timelineTrack       = $('timelineTrack');
  const timelineDurLabel    = $('timelineDurationLabel');
  
  const hoverCursor         = $('hoverCursor');
  const timelineTooltip     = $('timelineTooltip');
  const tooltipThumb        = $('tooltipThumb');
  const tooltipTime         = $('tooltipTime');
  
  const fadeSelectorEl      = $('fadeSelector');
  const fadePreviewLabel    = $('fadePreviewLabel');
  const fvFade              = $('fvFade');
  const fvFade2             = $('fvFade2');
  const fvBlack             = document.querySelector('.fv-black');
  
  const ratioBtns           = document.querySelectorAll('.ratio-btn');
  const fitBtns             = document.querySelectorAll('.fit-btn');
  const fitModeGroup        = $('fitModeGroup');
  const vibeSelector        = $('vibeSelector');
  const overlayTextInput    = $('overlayText');
  const volumeSlider        = $('volumeSlider');
  const volumeVal           = $('volumeVal');
  const batchCountInput     = $('batchCount');
  const btnDecBatch         = $('btnDecBatch');
  const btnIncBatch         = $('btnIncBatch');
  const btnGenerate         = $('btnGenerate');
  
  const queueBoard          = $('queueBoard');
  const queueCards          = $('queueCardsContainer');
  const playerPanel         = $('playerPanel');
  const previewPlayer       = $('previewPlayer');
  const playerWrapper       = $('playerWrapper');
  const btnDownload         = $('btnDownload');
  const btnOpenFolder       = $('btnOpenFolder');
  const btnRefreshHistory   = $('btnRefreshHistory');
  const historyGrid         = $('historyGrid');

  // Bind event listeners
  btnBrowse.addEventListener('click', browseFile);
  btnProbe.addEventListener('click', probeFile);
  filePathInput.addEventListener('keydown', e => { if (e.key === 'Enter') probeFile(); });

  toggleTemplate.addEventListener('change', () => {
    state.useTemplate = toggleTemplate.checked;
    templatePanel.classList.toggle('hidden', !state.useTemplate);
    if (!state.useTemplate) {
      state.templateMidFile = null;
      state.templateEndFile = null;
      updateStructureVis();
    }
  });

  btnBrowseFolder.addEventListener('click', browseFolder);
  btnScanTemplate.addEventListener('click', scanTemplate);

  document.querySelectorAll('.counter-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const dir      = btn.dataset.dir === '+' ? 1 : -1;
      const input    = $(targetId);
      let val = parseInt(input.value, 10) + dir;
      val = Math.max(1, Math.min(10, val));
      input.value = val;
      if (targetId === 'midSecs') { state.templateMidDuration = val; updateStructureVis(); }
      if (targetId === 'endSecs') { state.templateEndDuration = val; updateStructureVis(); }
    });
  });

  btnReroll.addEventListener('click', rerollClips);

  ratioBtns.forEach(b => b.addEventListener('click', () => {
    ratioBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.selectedRatio = b.dataset.ratio;
    fitModeGroup.classList.toggle('disabled-state', state.selectedRatio === 'original');
  }));

  fitBtns.forEach(b => b.addEventListener('click', () => {
    fitBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.selectedFit = b.dataset.fit;
  }));

  vibeSelector.addEventListener('change', () => {
    state.selectedVibe = vibeSelector.value;
    rerollClips();
  });

  btnDecBatch.addEventListener('click', () => {
    const v = Math.max(1, +batchCountInput.value - 1);
    batchCountInput.value = state.batchCount = v;
  });
  btnIncBatch.addEventListener('click', () => {
    const v = Math.min(10, +batchCountInput.value + 1);
    batchCountInput.value = state.batchCount = v;
  });

  volumeSlider.addEventListener('input', () => {
    state.volume = +volumeSlider.value;
    volumeVal.textContent = `${Math.round(state.volume * 100)}%`;
  });

  btnModeAuto.addEventListener('click', () => setSelectionMode('automatic'));
  btnModeManual.addEventListener('click', () => setSelectionMode('manual'));

  const FADE_LABELS = { '0': '0ms · Hard Cut', '0.25': '250ms · Quick', '0.5': '500ms · Cinematic', '0.8': '800ms · Slow Burn' };
  document.querySelectorAll('.fade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.fadeDuration = parseFloat(btn.dataset.fade);
      if (fadePreviewLabel) fadePreviewLabel.textContent = FADE_LABELS[btn.dataset.fade] || '';
      const fPx = Math.round(state.fadeDuration * 60);
      if (fvFade)  fvFade.style.width  = `${fPx}px`;
      if (fvFade2) fvFade2.style.width = `${fPx}px`;
      if (fvBlack) fvBlack.style.width = state.fadeDuration === 0 ? '0px' : '8px';
    });
  });

  btnGenerate.addEventListener('click', startGeneration);
  btnOpenFolder.addEventListener('click', openFolder);
  btnRefreshHistory.addEventListener('click', loadHistory);
  
  setupTimelineEvents();
  loadHistory();

  // Async browse, probe and other sub-actions scoped within initBatchGen
  async function browseFile() {
    btnBrowse.textContent = 'BROWSING…';
    btnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.filePath) {
        filePathInput.value = d.filePath;
        await probeFile();
      }
    } catch (e) { toast(e.message || 'Browse failed.', 'error'); }
    finally { btnBrowse.textContent = 'BROWSE'; btnBrowse.disabled = false; }
  }

  async function probeFile() {
    const p = filePathInput.value.trim();
    if (!p) { toast('Enter a file path first.', 'error'); return; }
    btnProbe.textContent = 'PROBING…'; btnProbe.disabled = true;
    try {
      const r = await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: p }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      state.filePath  = p;
      state.mediaInfo = d;
      state.manualClips = [];

      metaFileName.textContent  = d.fileName;
      metaSize.textContent      = `${d.sizeGB} GB`;
      metaDuration.textContent  = fmtSec(d.duration);
      metaResolution.textContent = d.hasVideo ? `${d.width}×${d.height} @ ${d.fps}fps` : 'Audio Only';
      mediaTypeBadge.textContent = d.hasVideo ? 'VIDEO DETECTED' : 'AUDIO DETECTED';

      if (d.thumbnailUrl) { inputThumb.src = d.thumbnailUrl; inputThumbWrap.classList.remove('hidden'); }
      else inputThumbWrap.classList.add('hidden');

      probeResultCard.classList.remove('hidden');
      configSection.classList.remove('disabled-state');
      btnReroll.removeAttribute('disabled');
      btnGenerate.classList.remove('disabled-state');
      timelineDurLabel.textContent = fmtSec(d.duration);

      rerollClips();
      updateStructureVis();
      toast('Source analysis complete!');
    } catch (e) {
      toast(e.message || 'Probe failed.', 'error');
      probeResultCard.classList.add('hidden');
      configSection.classList.add('disabled-state');
      btnGenerate.classList.add('disabled-state');
    } finally { btnProbe.textContent = 'ANALYZE'; btnProbe.disabled = false; }
  }

  function setSelectionMode(mode) {
    state.mode = mode;
    btnModeAuto.classList.toggle('active', mode === 'automatic');
    btnModeManual.classList.toggle('active', mode === 'manual');
    
    manualClipsPanel.classList.toggle('hidden', mode !== 'manual');
    vibeConfigGroup.classList.toggle('hidden', mode === 'manual');
    
    if (mode === 'manual') {
      if ((!state.manualClips || !state.manualClips.length) && state.mediaInfo) {
        const dur = state.mediaInfo.duration;
        state.manualClips = [];
        const chunk = dur / 4;
        for (let i = 0; i < 4; i++) {
          const targetStart = i * chunk + Math.max(0, (chunk - 5) / 2);
          state.manualClips.push({
            start: parseFloat(Math.max(0, Math.min(dur - 5, targetStart)).toFixed(1)),
            duration: 5,
            panX: 0
          });
        }
      }
      renderManualClips();
      syncClipsToTimeline();
    } else {
      rerollClips();
    }
    updateStructureVis();
  }

  function updateTooltipThumbnail(time) {
    if (tooltipThumbTimer) clearTimeout(tooltipThumbTimer);
    tooltipThumbTimer = setTimeout(() => {
      if (!state.mediaInfo) return;
      const thumbUrl = `/api/thumbnail-at?filePath=${encodeURIComponent(state.filePath)}&time=${parseFloat(time.toFixed(1))}`;
      const img = $('tooltipThumb');
      if (img) img.src = thumbUrl;
    }, 100);
  }

  function setupTimelineEvents() {
    timelineTrack.addEventListener('mousemove', e => {
      if (!state.mediaInfo) return;
      
      const rect = timelineTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const time = pct * state.mediaInfo.duration;
      
      hoverCursor.style.left = `${pct * 100}%`;
      hoverCursor.classList.remove('hidden');
      
      timelineTooltip.style.left = `${x}px`;
      timelineTooltip.classList.remove('hidden');
      
      tooltipTime.textContent = fmtSec(time);
      updateTooltipThumbnail(time);
    });
    
    timelineTrack.addEventListener('mouseleave', () => {
      hoverCursor.classList.add('hidden');
      timelineTooltip.classList.add('hidden');
    });
    
    timelineTrack.addEventListener('click', e => {
      if (!state.mediaInfo) return;
      if (state.mode !== 'manual') return;
      
      const rect = timelineTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const clickedTime = pct * state.mediaInfo.duration;
      
      const maxStart = state.mediaInfo.duration - 5;
      const finalStart = parseFloat(Math.max(0, Math.min(maxStart, clickedTime)).toFixed(1));
      
      state.manualClips[state.activeCutIndex].start = finalStart;
      toast(`Cut ${state.activeCutIndex + 1} set to ${fmtSec(finalStart)}s`);
      state.activeCutIndex = (state.activeCutIndex + 1) % 4;
      
      renderManualClips();
      syncClipsToTimeline();
    });
  }

  function renderManualClips() {
    clipListContainer.innerHTML = '';
    if (!state.mediaInfo) return;
    const dur = state.mediaInfo.duration;

    state.manualClips.forEach((clip, index) => {
      const card = document.createElement('div');
      card.className = `manual-clip-card${state.activeCutIndex === index ? ' active-placement' : ''}`;
      card.draggable = true;
      card.dataset.index = index;

      card.innerHTML = `
        <div class="drag-handle" title="Drag to reorder sequence">☰</div>
        <div class="clip-card-thumb">
          <img src="" id="thumb_clip_${index}" alt="Frame">
          <div class="scanline"></div>
          <span class="clip-index-badge">CUT ${index + 1}</span>
        </div>
        <div class="clip-card-body">
          <div class="clip-card-time-row">
            <span class="neon-label" style="font-size:0.65rem">START TIME</span>
            <div class="time-input-group">
              <input type="number" step="0.1" min="0" max="${(dur - 5).toFixed(1)}" class="clip-time-input" data-index="${index}" id="time_input_${index}" value="${clip.start}">
              <span class="unit">sec</span>
            </div>
          </div>
          <input type="range" class="clip-time-slider" data-index="${index}" id="time_slider_${index}" min="0" max="${dur - 5}" step="0.1" value="${clip.start}">
          
          <div class="clip-card-pan-row">
            <span class="neon-label" style="font-size:0.65rem">SUBJECT FOCUS (PAN X)</span>
            <span class="pan-value-label" id="pan_val_${index}">${getPanLabel(clip.panX)}</span>
          </div>
          <input type="range" class="clip-pan-slider" data-index="${index}" id="pan_slider_${index}" min="-1" max="1" step="0.1" value="${clip.panX}">
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.clip-time-input') || e.target.closest('.clip-time-slider') || e.target.closest('.clip-pan-slider') || e.target.closest('.drag-handle')) {
          return;
        }
        state.activeCutIndex = index;
        renderManualClips();
      });

      const timeInput  = card.querySelector(`#time_input_${index}`);
      const timeSlider = card.querySelector(`#time_slider_${index}`);
      const panSlider  = card.querySelector(`#pan_slider_${index}`);
      const panLabel   = card.querySelector(`#pan_val_${index}`);

      const updateTime = (val) => {
        let t = parseFloat(val);
        if (isNaN(t)) t = 0;
        t = Math.max(0, Math.min(dur - 5, t));
        
        clip.start = parseFloat(t.toFixed(1));
        timeInput.value = clip.start;
        timeSlider.value = clip.start;
        
        syncClipsToTimeline();
        requestCardThumbnail(index, clip.start);
      };

      timeInput.addEventListener('input', () => updateTime(timeInput.value));
      timeSlider.addEventListener('input', () => updateTime(timeSlider.value));

      panSlider.addEventListener('input', () => {
        clip.panX = parseFloat(panSlider.value);
        panLabel.textContent = getPanLabel(clip.panX);
      });

      requestCardThumbnail(index, clip.start);
      clipListContainer.appendChild(card);
    });

    setupDragAndDrop();
  }

  function getPanLabel(val) {
    if (val === 0) return 'Center';
    if (val < 0) {
      if (val <= -0.8) return 'Far Left';
      return 'Left Shift';
    } else {
      if (val >= 0.8) return 'Far Right';
      return 'Right Shift';
    }
  }

  function requestCardThumbnail(index, time) {
    if (thumbDebounceTimers[index]) clearTimeout(thumbDebounceTimers[index]);
    
    thumbDebounceTimers[index] = setTimeout(async () => {
      const img = $(`thumb_clip_${index}`);
      if (!img) return;
      img.style.opacity = '0.4';
      img.src = `/api/thumbnail-at?filePath=${encodeURIComponent(state.filePath)}&time=${time}`;
      img.onload = () => { img.style.opacity = '1'; };
    }, 150);
  }

  function setupDragAndDrop() {
    const cards = clipListContainer.querySelectorAll('.manual-clip-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', e => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.index);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingCard = clipListContainer.querySelector('.dragging');
        const cardOver = e.target.closest('.manual-clip-card');
        
        if (cardOver && cardOver !== draggingCard) {
          const rect = cardOver.getBoundingClientRect();
          const midpoint = (rect.top + rect.bottom) / 2;
          if (e.clientY < midpoint) {
            clipListContainer.insertBefore(draggingCard, cardOver);
          } else {
            clipListContainer.insertBefore(draggingCard, cardOver.nextSibling);
          }
        }
      });

      card.addEventListener('drop', e => {
        e.preventDefault();
        const newOrder = Array.from(clipListContainer.children).map(child => parseInt(child.dataset.index, 10));
        const updatedClips = newOrder.map(idx => state.manualClips[idx]);
        state.manualClips = updatedClips;
        
        renderManualClips();
        syncClipsToTimeline();
        toast('Sequence reordered!');
      });
    });
  }

  function syncClipsToTimeline() {
    state.currentClips = state.manualClips.map(clip => ({
      start: clip.start,
      duration: 5,
      panX: clip.panX
    }));
    renderTimeline();
  }

  async function browseFolder() {
    btnBrowseFolder.textContent = 'BROWSING…'; btnBrowseFolder.disabled = true;
    try {
      const r = await fetch('/api/browse-folder', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.folderPath) {
        templateFolderPath.value = d.folderPath;
        await scanTemplate();
      }
    } catch (e) { toast(e.message || 'Folder browse failed.', 'error'); }
    finally { btnBrowseFolder.textContent = 'BROWSE FOLDER'; btnBrowseFolder.disabled = false; }
  }

  async function scanTemplate() {
    const p = templateFolderPath.value.trim();
    if (!p) { toast('Select a template folder first.', 'error'); return; }
    btnScanTemplate.textContent = 'SCANNING…'; btnScanTemplate.disabled = true;
    try {
      const r = await fetch('/api/scan-template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderPath: p }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      state.templateMidFile = d.midClip.filePath;
      state.templateEndFile = d.endClip.filePath;

      midFileName.textContent = d.midClip.fileName;
      midDuration.textContent = `${fmtSec(d.midClip.duration)} total`;
      endFileName.textContent = d.endClip.fileName;
      endDuration.textContent = `${fmtSec(d.endClip.duration)} total`;

      templateCards.classList.remove('hidden');
      structureVis.classList.remove('hidden');
      updateStructureVis();

      toast(`Template loaded: ${d.midClip.fileName} + ${d.endClip.fileName}`);
    } catch (e) { toast(e.message || 'Template scan failed.', 'error'); }
    finally { btnScanTemplate.textContent = 'SCAN'; btnScanTemplate.disabled = false; }
  }

  function updateStructureVis() {
    if (!state.mediaInfo) return;
    if (!state.useTemplate || !state.templateMidFile) {
      structureVis.classList.add('hidden');
      return;
    }
    structureVis.classList.remove('hidden');

    const total    = 30;
    const midS     = state.templateMidDuration;
    const endS     = state.templateEndDuration;
    const randS    = Math.max(0, total - midS - endS);
    const rand1    = Math.round(randS / 2);
    const rand2    = randS - rand1;

    stRand1.style.flex = `${rand1} 0 0`;
    stMid.style.flex   = `${midS} 0 0`;
    stRand2.style.flex = `${rand2} 0 0`;
    stEnd.style.flex   = `${endS} 0 0`;

    stMid.querySelector('span').textContent = `MID ${midS}s`;
    stEnd.querySelector('span').textContent = `TITLE ${endS}s`;
  }

  function rerollClips() {
    if (!state.mediaInfo) return;
    const dur     = state.mediaInfo.duration;

    if (state.mode === 'manual') {
      state.manualClips = [];
      const chunk = dur / 4;
      for (let i = 0; i < 4; i++) {
        const targetStart = i * chunk + Math.max(0, (chunk - 5) / 2) + (Math.random() - 0.5) * (chunk - 5);
        state.manualClips.push({
          start: parseFloat(Math.max(0, Math.min(dur - 5, targetStart)).toFixed(1)),
          duration: 5,
          panX: 0
        });
      }
      renderManualClips();
      syncClipsToTimeline();
    } else {
      const midS    = state.useTemplate ? state.templateMidDuration : 0;
      const endS    = state.useTemplate ? state.templateEndDuration : 0;
      const randTot = Math.min(30 - midS - endS, dur);

      let numClips = state.selectedVibe === 'cinematic' ? 2 : state.selectedVibe === 'fast-cut' ? 10 : Math.floor(Math.random() * 4) + 3;
      state.currentClips = calcClips(dur, numClips, state.selectedVibe, randTot);
      renderTimeline();
    }
  }

  function calcClips(videoDur, num, vibe, total) {
    const clips = [];
    if (vibe === 'cinematic' || vibe === 'fast-cut') {
      const cd  = total / num;
      const seg = videoDur / num;
      for (let i = 0; i < num; i++) {
        const ss  = i * seg, es = (i + 1) * seg;
        const ms  = Math.max(ss, es - cd);
        const s   = ss + Math.random() * (ms - ss);
        clips.push({ start: Math.max(0, +s.toFixed(2)), duration: +cd.toFixed(2) });
      }
    } else {
      let rem = total;
      const mn = 2, mx = Math.max(3, total / 2);
      const durs = [];
      for (let i = 0; i < num - 1; i++) {
        const lim = rem - (num - 1 - i) * mn;
        const d   = lim <= mn ? mn : mn + Math.random() * (Math.min(mx, lim) - mn);
        durs.push(+d.toFixed(2)); rem -= d;
      }
      durs.push(+rem.toFixed(2));
      const seg = videoDur / num;
      for (let i = 0; i < num; i++) {
        const d  = durs[i], ss = i * seg, es = (i + 1) * seg;
        const ms = Math.max(ss, es - d), s = ss + Math.random() * (ms - ss);
        clips.push({ start: Math.max(0, +s.toFixed(2)), duration: d });
      }
    }
    return clips;
  }

  function renderTimeline() {
    timelineTrack.querySelectorAll('.timeline-clip-highlight').forEach(h => h.remove());
    if (!state.mediaInfo) return;
    const dur = state.mediaInfo.duration;
    state.currentClips.forEach(c => {
      const div = document.createElement('div');
      div.className = 'timeline-clip-highlight';
      div.style.left  = `${(c.start / dur) * 100}%`;
      div.style.width = `${(c.duration / dur) * 100}%`;
      div.title = `${fmtSec(c.start)} | +${c.duration}s`;
      timelineTrack.appendChild(div);
    });
  }

  async function startGeneration() {
    if (!state.mediaInfo) return;
    if (state.useTemplate && (!state.templateMidFile || !state.templateEndFile)) {
      toast('Scan your template folder first!', 'error'); return;
    }

    const payload = {
      filePath:              state.filePath,
      shortCount:            state.batchCount,
      totalDuration:         30,
      vibe:                  state.selectedVibe,
      aspectRatio:           state.selectedRatio,
      fitMode:               state.selectedFit,
      overlayText:           overlayTextInput.value.trim(),
      volume:                state.volume,
      timelineClips:         state.currentClips,
      mode:                  state.mode,
      clips:                 state.mode === 'manual' ? state.manualClips : null,
      useTemplate:           state.useTemplate,
      templateMidFile:       state.templateMidFile,
      templateEndFile:       state.templateEndFile,
      templateMidDuration:   state.templateMidDuration,
      templateEndDuration:   state.templateEndDuration,
      fadeDuration:          state.fadeDuration,
    };

    btnGenerate.disabled = true;
    btnGenerate.classList.add('disabled-state');
    configSection.classList.add('disabled-state');

    queueBoard.classList.remove('hidden');
    queueCards.innerHTML = '';

    for (let i = 0; i < state.batchCount; i++) {
      const card = document.createElement('div');
      card.className = 'queue-card queued';
      card.id = `job_card_${i}`;
      card.innerHTML = `
        <div class="card-header-row">
          <span class="job-title">SHORT_${String(i + 1).padStart(2, '0')}</span>
          <span class="status-badge queued">QUEUED</span>
        </div>
        <div class="progress-container">
          <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
          <span class="progress-percent">0%</span>
        </div>
        <div class="job-log">Awaiting scheduler…</div>
      `;
      queueCards.appendChild(card);
    }

    try {
      const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      state.activeBatchId  = d.batchId;
      state.pollInterval   = setInterval(pollProgress, 600);
      toast('Batch dispatched! Render engine online.');
    } catch (e) {
      toast(e.message || 'Generation failed.', 'error');
      btnGenerate.disabled = false;
      btnGenerate.classList.remove('disabled-state');
      configSection.classList.remove('disabled-state');
    }
  }

  async function pollProgress() {
    if (!state.activeBatchId) return;
    try {
      const r = await fetch(`/api/status/${state.activeBatchId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      let allDone = true;
      d.jobs.forEach(job => {
        const card = $(`job_card_${job.index}`);
        if (!card) return;

        const isDone = job.status === 'completed' || job.status === 'failed';
        card.className = `queue-card ${isDone ? job.status : 'processing'}`;

        const badge = card.querySelector('.status-badge');
        badge.className = `status-badge ${isDone ? job.status : 'processing'}`;
        badge.textContent = job.status.toUpperCase();

        card.querySelector('.progress-fill').style.width    = `${job.progress}%`;
        card.querySelector('.progress-percent').textContent = `${job.progress}%`;
        card.querySelector('.job-log').textContent =
          job.status === 'completed' ? `✅ ${job.outputFileName}` :
          job.status === 'failed'    ? `❌ ${job.error}` :
          job.status === 'queued'    ? 'Waiting in queue…' :
          `⚙️ ${job.status}`;

        if (job.status === 'completed' && !card.dataset.linked) {
          card.dataset.linked = '1';
          card.style.cursor = 'pointer';
          card.addEventListener('click', () => loadPlayer(job.outputPath));
        }
        if (!isDone) allDone = false;
      });

      if (allDone) {
        clearInterval(state.pollInterval); state.pollInterval = null; state.activeBatchId = null;
        btnGenerate.disabled = false;
        btnGenerate.classList.remove('disabled-state');
        configSection.classList.remove('disabled-state');
        const first = d.jobs.find(j => j.status === 'completed');
        if (first) { loadPlayer(first.outputPath); toast('All shorts generated!', 'success'); }
        else toast('Batch completed with errors.', 'error');
        loadHistory();
      }
    } catch (e) {
      clearInterval(state.pollInterval); state.pollInterval = null;
      toast('Polling lost connection.', 'error');
    }
  }

  function loadPlayer(url) {
    previewPlayer.src = url;
    btnDownload.href  = url;
    const cls = { vertical: 'ratio-vertical', square: 'ratio-square', landscape: 'ratio-landscape' };
    playerWrapper.className = `player-wrapper ${cls[state.selectedRatio] || ''}`;
    playerPanel.classList.remove('hidden');
    playerPanel.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadHistory() {
    try {
      const r = await fetch('/api/history');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      historyGrid.innerHTML = '';
      if (!d.history.length) {
        historyGrid.innerHTML = '<div class="history-empty"><p class="cyber-dim">No shorts generated yet.</p></div>';
        return;
      }
      d.history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="history-thumb">${item.thumbnailPath ? `<img src="${item.thumbnailPath}" alt="">` : '<div style="width:100%;height:100%;background:rgba(5,7,14,.8);display:flex;align-items:center;justify-content:center;font-size:2rem">🎬</div>'}</div>
          <div class="history-overlay">
            <div class="history-play-icon">▶</div>
            <div class="history-name">${item.fileName}</div>
            <div class="history-meta"><span>${item.sizeMB} MB</span><span>${fmtDate(item.createdAt)}</span></div>
          </div>
        `;
        card.addEventListener('click', () => loadPlayer(item.outputPath));
        historyGrid.appendChild(card);
      });
    } catch (e) { toast('Failed to load history.', 'error'); }
  }

  async function openFolder() {
    try {
      const r = await fetch('/api/open-folder', { method: 'POST' });
      if (r.ok) toast('Exports folder opened.');
      else toast('Could not open folder.', 'error');
    } catch { toast('Could not open folder.', 'error'); }
  }
}
