// |â‚¬|â‚¬|â‚¬ State |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
const state = {
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
  // Template state
  useTemplate:     false,
  templateMidFile: null,
  templateEndFile: null,
  templateMidDuration: 3,
  templateEndDuration: 3,
  // Clip selection mode
  mode:            'automatic', // "automatic" or "manual"
  manualClips:     [],          // [{ start: 0, duration: 5, panX: 0 }]
  activeCutIndex:  0,           // Currently active manual card slot index
  // Transition fade
  fadeDuration:    0.5,         // seconds: 0=hard cut, 0.25, 0.5, 0.8
};

// |â‚¬|â‚¬|â‚¬ DOM Elements |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
const $ = id => document.getElementById(id);

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

// Mode & manual selectors
const btnModeAuto         = $('btnModeAuto');
const btnModeManual       = $('btnModeManual');
const manualClipsPanel    = $('manualClipsPanel');
const vibeConfigGroup     = $('vibeConfigGroup');
const clipListContainer   = $('clipListContainer');

const btnReroll           = $('btnReroll');
const timelineTrack       = $('timelineTrack');
const timelineDurLabel    = $('timelineDurationLabel');

// Floating elements
const hoverCursor         = $('hoverCursor');
const timelineTooltip     = $('timelineTooltip');
const tooltipThumb        = $('tooltipThumb');
const tooltipTime         = $('tooltipTime');

// Fade transition controls
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
const playerWrapper       = $('playerWrapper');
const previewPlayer       = $('previewPlayer');
const btnDownload         = $('btnDownload');
const btnOpenFolder       = $('btnOpenFolder');
const historyGrid         = $('historyGrid');
const btnRefreshHistory   = $('btnRefreshHistory');
const toastContainer      = $('toastContainer');

// |â‚¬|â‚¬|â‚¬ Init |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
window.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  loadHistory();
  initTabNav();
  initCropStudio();
  initRandomGen();
  initSubtitles();
});

// |â‚¬|â‚¬|â‚¬ Toast |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'error' ? 'Ã¢ÂÅ’' : 'Ã¢Å¡Â¡'}</span><span>${msg}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideIn .3s reverse forwards';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// |â‚¬|â‚¬|â‚¬ Listeners |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function setupListeners() {
  btnBrowse.addEventListener('click', browseFile);
  btnProbe.addEventListener('click', probeFile);
  filePathInput.addEventListener('keydown', e => { if (e.key === 'Enter') probeFile(); });

  // Template toggle
  toggleTemplate.addEventListener('change', () => {
    state.useTemplate = toggleTemplate.checked;
    templatePanel.classList.toggle('hidden', !state.useTemplate);
    if (!state.useTemplate) {
      // clear template state but keep UI usable
      state.templateMidFile = null;
      state.templateEndFile = null;
      updateStructureVis();
    }
  });

  btnBrowseFolder.addEventListener('click', browseFolder);
  btnScanTemplate.addEventListener('click', scanTemplate);

  // Slice second counters
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

  // Mode selectors listeners
  btnModeAuto.addEventListener('click', () => setSelectionMode('automatic'));
  btnModeManual.addEventListener('click', () => setSelectionMode('manual'));

  // Fade transition selector
  const FADE_LABELS = { '0': '0ms Ã‚Â· Hard Cut', '0.25': '250ms Ã‚Â· Quick', '0.5': '500ms Ã‚Â· Cinematic', '0.8': '800ms Ã‚Â· Slow Burn' };
  document.querySelectorAll('.fade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.fadeDuration = parseFloat(btn.dataset.fade);
      if (fadePreviewLabel) fadePreviewLabel.textContent = FADE_LABELS[btn.dataset.fade] || '';
      // Animate the visualizer
      const fPx = Math.round(state.fadeDuration * 60); // px proportional to duration
      if (fvFade)  fvFade.style.width  = `${fPx}px`;
      if (fvFade2) fvFade2.style.width = `${fPx}px`;
      if (fvBlack) fvBlack.style.width = state.fadeDuration === 0 ? '0px' : '8px';
    });
  });

  btnGenerate.addEventListener('click', startGeneration);
  btnOpenFolder.addEventListener('click', openFolder);
  btnRefreshHistory.addEventListener('click', loadHistory);
  
  setupTimelineEvents();
}

// |â‚¬|â‚¬|â‚¬ Browse Source File |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
async function browseFile() {
  btnBrowse.textContent = 'BROWSING-Â¦';
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

// |â‚¬|â‚¬|â‚¬ Probe Source |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
async function probeFile() {
  const p = filePathInput.value.trim();
  if (!p) { toast('Enter a file path first.', 'error'); return; }
  btnProbe.textContent = 'PROBING-Â¦'; btnProbe.disabled = true;
  try {
    const r = await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: p }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);

    state.filePath  = p;
    state.mediaInfo = d;
    state.manualClips = []; // Reset manual clips for the new video

    metaFileName.textContent  = d.fileName;
    metaSize.textContent      = `${d.sizeGB} GB`;
    metaDuration.textContent  = fmtSec(d.duration);
    metaResolution.textContent = d.hasVideo ? `${d.width}Ãƒâ€”${d.height} @ ${d.fps}fps` : 'Audio Only';
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

// |â‚¬|â‚¬|â‚¬ Set Selection Mode (Manual vs Auto) |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function setSelectionMode(mode) {
  state.mode = mode;
  btnModeAuto.classList.toggle('active', mode === 'automatic');
  btnModeManual.classList.toggle('active', mode === 'manual');
  
  manualClipsPanel.classList.toggle('hidden', mode !== 'manual');
  vibeConfigGroup.classList.toggle('hidden', mode === 'manual');
  
  if (mode === 'manual') {
    // Populate default manual clips if empty
    if ((!state.manualClips || !state.manualClips.length) && state.mediaInfo) {
      const dur = state.mediaInfo.duration;
      state.manualClips = [];
      const chunk = dur / 4;
      for (let i = 0; i < 4; i++) {
        // Ensure starting time fits within duration-5 limit
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
    // Automatic mode: fall back to vibe calculations
    rerollClips();
  }
  updateStructureVis();
}

// |â‚¬|â‚¬|â‚¬ Timeline Interactive Cursor & Hover Tooltip Previews |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
let tooltipThumbTimer = null;
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
    
    // Position vertical line cursor
    hoverCursor.style.left = `${pct * 100}%`;
    hoverCursor.classList.remove('hidden');
    
    // Position floating card preview tooltip
    timelineTooltip.style.left = `${x}px`;
    timelineTooltip.classList.remove('hidden');
    
    // Update tooltip text
    tooltipTime.textContent = fmtSec(time);
    
    // Throttled frame loading
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
    
    // Ensure cut fits in the video duration
    const maxStart = state.mediaInfo.duration - 5;
    const finalStart = parseFloat(Math.max(0, Math.min(maxStart, clickedTime)).toFixed(1));
    
    // Set active slot start time
    state.manualClips[state.activeCutIndex].start = finalStart;
    
    toast(`Cut ${state.activeCutIndex + 1} set to ${fmtSec(finalStart)}s`);
    
    // Advance active slot index sequentially
    state.activeCutIndex = (state.activeCutIndex + 1) % 4;
    
    renderManualClips();
    syncClipsToTimeline();
  });
}

// |â‚¬|â‚¬|â‚¬ Render Manual Clip Editor Cards |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
      <div class="drag-handle" title="Drag to reorder sequence">Ã¢ËœÂ°</div>
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

    // Clicking the card targets it as the active slot for placement
    card.addEventListener('click', (e) => {
      if (e.target.closest('.clip-time-input') || e.target.closest('.clip-time-slider') || e.target.closest('.clip-pan-slider') || e.target.closest('.drag-handle')) {
        return;
      }
      state.activeCutIndex = index;
      renderManualClips();
    });

    // Hook inputs synchronization
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

    // Request initial thumbnail preview
    requestCardThumbnail(index, clip.start);

    clipListContainer.appendChild(card);
  });

  // Setup HTML5 Drag and Drop events
  setupDragAndDrop();
}

// Pan value descriptor label
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

// |â‚¬|â‚¬|â‚¬ Debounced Frame Preview Loader |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
let thumbDebounceTimers = {};
function requestCardThumbnail(index, time) {
  if (thumbDebounceTimers[index]) clearTimeout(thumbDebounceTimers[index]);
  
  thumbDebounceTimers[index] = setTimeout(async () => {
    const img = $(`thumb_clip_${index}`);
    if (!img) return;
    img.style.opacity = '0.4';
    
    // Fetch frame directly from express API mjpeg stream pipeline
    img.src = `/api/thumbnail-at?filePath=${encodeURIComponent(state.filePath)}&time=${time}`;
    img.onload = () => { img.style.opacity = '1'; };
  }, 150);
}

// |â‚¬|â‚¬|â‚¬ Drag & Drop Sequencing |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
      
      // Compute new order based on current DOM arrangement
      const newOrder = Array.from(clipListContainer.children).map(child => parseInt(child.dataset.index, 10));
      const updatedClips = newOrder.map(idx => state.manualClips[idx]);
      
      state.manualClips = updatedClips;
      
      // Re-render and rebuild layout to update indexes
      renderManualClips();
      syncClipsToTimeline();
      toast('Sequence reordered!');
    });
  });
}

// |â‚¬|â‚¬|â‚¬ Sync Manual Clips to Timeline Track |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function syncClipsToTimeline() {
  state.currentClips = state.manualClips.map(clip => ({
    start: clip.start,
    duration: 5,
    panX: clip.panX
  }));
  renderTimeline();
}

// |â‚¬|â‚¬|â‚¬ Browse Template Folder |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
async function browseFolder() {
  btnBrowseFolder.textContent = 'BROWSING-Â¦'; btnBrowseFolder.disabled = true;
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

// |â‚¬|â‚¬|â‚¬ Scan Template Folder |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
async function scanTemplate() {
  const p = templateFolderPath.value.trim();
  if (!p) { toast('Select a template folder first.', 'error'); return; }
  btnScanTemplate.textContent = 'SCANNING-Â¦'; btnScanTemplate.disabled = true;
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

// |â‚¬|â‚¬|â‚¬ Structure Visualiser |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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

  // Proportional flex widths
  stRand1.style.flex = `${rand1} 0 0`;
  stMid.style.flex   = `${midS} 0 0`;
  stRand2.style.flex = `${rand2} 0 0`;
  stEnd.style.flex   = `${endS} 0 0`;

  stMid.querySelector('span').textContent = `MID ${midS}s`;
  stEnd.querySelector('span').textContent = `TITLE ${endS}s`;
}

// |â‚¬|â‚¬|â‚¬ Timeline Clip Calculator |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
    div.title = `${fmtSec(c.start)} | â€™ +${c.duration}s`;
    timelineTrack.appendChild(div);
  });
}

// |â‚¬|â‚¬|â‚¬ Generate |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
      <div class="job-log">Awaiting scheduler-Â¦</div>
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

// |â‚¬|â‚¬|â‚¬ Polling |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
        job.status === 'completed' ? `Ã¢Å“â€¦ ${job.outputFileName}` :
        job.status === 'failed'    ? `Ã¢ÂÅ’ ${job.error}` :
        job.status === 'queued'    ? 'Waiting in queue-Â¦' :
        `Ã¢Å¡â„¢Ã¯Â¸Â ${job.status}`;

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

// |â‚¬|â‚¬|â‚¬ Player |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function loadPlayer(url) {
  previewPlayer.src = url;
  btnDownload.href  = url;
  const cls = { vertical: 'ratio-vertical', square: 'ratio-square', landscape: 'ratio-landscape' };
  playerWrapper.className = `player-wrapper ${cls[state.selectedRatio] || ''}`;
  playerPanel.classList.remove('hidden');
  playerPanel.scrollIntoView({ behavior: 'smooth' });
}

// |â‚¬|â‚¬|â‚¬ History |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
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
        <div class="history-thumb">${item.thumbnailPath ? `<img src="${item.thumbnailPath}" alt="">` : '<div style="width:100%;height:100%;background:rgba(5,7,14,.8);display:flex;align-items:center;justify-content:center;font-size:2rem">Ã°Å¸Å½Â¬</div>'}</div>
        <div class="history-overlay">
          <div class="history-play-icon">|“Â¶</div>
          <div class="history-name">${item.fileName}</div>
          <div class="history-meta"><span>${item.sizeMB} MB</span><span>${fmtDate(item.createdAt)}</span></div>
        </div>
      `;
      card.addEventListener('click', () => loadPlayer(item.outputPath));
      historyGrid.appendChild(card);
    });
  } catch (e) { toast('Failed to load history.', 'error'); }
}

// |â‚¬|â‚¬|â‚¬ Open Folder |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
async function openFolder() {
  try {
    const r = await fetch('/api/open-folder', { method: 'POST' });
    if (r.ok) toast('Exports folder opened.');
    else toast('Could not open folder.', 'error');
  } catch { toast('Could not open folder.', 'error'); }
}

// |â‚¬|â‚¬|â‚¬ Formatters |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
function fmtSec(s) {
  if (!s && s !== 0) return '-â€';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    : `${m}:${String(ss).padStart(2,'0')}`;
}
function fmtDate(dt) {
  const d = new Date(dt);
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ===============================================================================
// TAB NAVIGATION
// ===============================================================================

// Global cleanup function for Crop Studio
let cleanupCropStudio = null;

function initTabNav() {
  const tabs = document.querySelectorAll('.app-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      
      // Cleanup Crop Studio when switching away
      if (cleanupCropStudio && target !== 'cropStudio') {
        cleanupCropStudio();
      }
      
      // Pause random preview player
      const randPlayer = document.getElementById('randomPreviewPlayer');
      if (randPlayer && target !== 'randomGen') {
        randPlayer.pause();
      }
      
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      let panel;
      if (target === 'batchGen') {
        panel = document.getElementById('panelBatchGen');
      } else if (target === 'randomGen') {
        panel = document.getElementById('panelRandomGen');
      } else if (target === 'cropStudio') {
        panel = document.getElementById('panelCropStudio');
      } else if (target === 'subtitles') {
        panel = document.getElementById('panelSubtitles');
      }
      if (panel) panel.classList.remove('hidden');
    });
  });
}

// ===============================================================================
// CROP STUDIO MODULE
// ===============================================================================

function initCropStudio() {
  // |â‚¬|â‚¬ DOM refs |â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬|â‚¬
  const cropFilePathEl    = document.getElementById('cropFilePath');
  const cropBtnBrowse     = document.getElementById('cropBtnBrowse');
  const cropBtnLoad       = document.getElementById('cropBtnLoad');
  const cropVideoMetaEl   = document.getElementById('cropVideoMeta');
  const cropMetaFile      = document.getElementById('cropMetaFile');
  const cropMetaDur       = document.getElementById('cropMetaDur');
  const cropMetaRes       = document.getElementById('cropMetaRes');
  const cropXSlider       = document.getElementById('cropXSlider');
  const cropYSlider       = document.getElementById('cropYSlider');
  const cropZoomSlider    = document.getElementById('cropZoomSlider');
  const cropXVal          = document.getElementById('cropXVal');
  const cropYVal          = document.getElementById('cropYVal');
  const cropZoomVal       = document.getElementById('cropZoomVal');
  const cropCanvas        = document.getElementById('cropCanvas');
  const cropCtx           = cropCanvas?.getContext('2d');
  const cropCanvasEmpty   = document.getElementById('cropCanvasEmpty');
  const cropCanvasInfo    = document.getElementById('cropCanvasInfo');
  const cropPreviewCanvas = document.getElementById('cropPreview');
  const cropPreviewCtx    = cropPreviewCanvas?.getContext('2d');
  // -- Filmstrip DOM refs ----------------------------------------------------
  const filmstripSection  = document.getElementById('filmstripSection');
  const fsRuler           = document.getElementById('fsRuler');
  const fsFrames          = document.getElementById('fsFrames');
  const fsLoading         = document.getElementById('fsLoading');
  const fsMaskLeft        = document.getElementById('fsMaskLeft');
  const fsMaskRight       = document.getElementById('fsMaskRight');
  const fsSelection       = document.getElementById('fsSelection');
  const fsHandleLeft      = document.getElementById('fsHandleLeft');
  const fsHandleRight     = document.getElementById('fsHandleRight');
  const fsTooltipLeft     = document.getElementById('fsTooltipLeft');
  const fsTooltipRight    = document.getElementById('fsTooltipRight');
  const fsPlayhead        = document.getElementById('fsPlayhead');
  const fsPlayheadTime    = document.getElementById('fsPlayheadTime');
  const fsTimeIn          = document.getElementById('fsTimeIn');
  const fsTimeOut         = document.getElementById('fsTimeOut');
  const fsDurationBadge   = document.getElementById('fsDurationBadge');
  const fsKeepBtn         = document.getElementById('fsKeepBtn');
  const fsRemoveBtn       = document.getElementById('fsRemoveBtn');
  const fsExportBtn       = document.getElementById('fsExportBtn');
  const fsFormatSelect    = document.getElementById('fsFormatSelect');
  const cropBtnPlayPause  = document.getElementById('cropBtnPlayPause');
  const cropRenderStatus  = document.getElementById('cropRenderStatus');
  const cropProgressFill  = document.getElementById('cropProgressFill');
  const cropStatusText    = document.getElementById('cropStatusText');
  const cropResultCard    = document.getElementById('cropResultCard');
  const cropResultLink    = document.getElementById('cropResultLink');
  const cropFitBlur       = document.getElementById('cropFitBlur');
  const cropFitCrop       = document.getElementById('cropFitCrop');

  // Early return if critical elements missing
  if (!cropCanvas || !cropCtx || !cropPreviewCanvas || !cropPreviewCtx) {
    console.error('[Crop Studio] Critical canvas elements missing');
    return;
  }


  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cs = {
    filePath: '', srcW: 0, srcH: 0, duration: 0,
    panX: 0, panY: 0, zoom: 1, fitMode: 'blur',
    loaded: false, playing: false,
    trimStart: 0, trimEnd: 0,
    drag: { active: false, startX: 0, startY: 0, origPanX: 0, origPanY: 0 },
  };

  const vid = document.createElement('video');
  vid.crossOrigin = 'anonymous';
  vid.playsInline = true;
  vid.muted = true;
  vid.preload = 'metadata';

  let rafId = null;

  function getCropRect() {
    const { srcW, srcH, panX, panY, zoom } = cs;
    if (!srcW || !srcH || !zoom || zoom <= 0) {
      return { x: 0, y: 0, w: srcW || 0, h: srcH || 0 };
    }
    const cropH = srcH / zoom;
    const cropW = cropH * (9 / 16);
    const maxOffX = (srcW - cropW) / 2;
    const maxOffY = (srcH - cropH) / 2;
    const cx = (srcW - cropW) / 2 + panX * maxOffX;
    const cy = (srcH - cropH) / 2 + panY * maxOffY;
    return {
      x: Math.max(0, Math.min(srcW - cropW, cx)),
      y: Math.max(0, Math.min(srcH - cropH, cy)),
      w: cropW, h: cropH,
    };
  }

  function drawFrame() {
    if (!cs.loaded) return;
    const cW = cropCanvas.width, cH = cropCanvas.height;

    cropCtx.clearRect(0, 0, cW, cH);
    cropCtx.drawImage(vid, 0, 0, cW, cH);

    const scX = cW / cs.srcW, scY = cH / cs.srcH;
    const cr = getCropRect();
    const dx = cr.x * scX, dy = cr.y * scY;
    const dw = cr.w * scX, dh = cr.h * scY;

    cropCtx.fillStyle = 'rgba(0,0,0,0.62)';
    cropCtx.fillRect(0, 0, dx, cH);
    cropCtx.fillRect(dx + dw, 0, cW - dx - dw, cH);
    cropCtx.fillRect(dx, 0, dw, dy);
    cropCtx.fillRect(dx, dy + dh, dw, cH - dy - dh);

    cropCtx.strokeStyle = '#06b6d4';
    cropCtx.lineWidth = 2;
    cropCtx.shadowColor = '#06b6d4';
    cropCtx.shadowBlur = 8;
    cropCtx.strokeRect(dx, dy, dw, dh);
    cropCtx.shadowBlur = 0;

    cropCtx.strokeStyle = 'rgba(6,182,212,0.25)';
    cropCtx.lineWidth = 1;
    for (let t = 1; t <= 2; t++) {
      cropCtx.beginPath(); cropCtx.moveTo(dx + dw * t / 3, dy); cropCtx.lineTo(dx + dw * t / 3, dy + dh); cropCtx.stroke();
      cropCtx.beginPath(); cropCtx.moveTo(dx, dy + dh * t / 3); cropCtx.lineTo(dx + dw, dy + dh * t / 3); cropCtx.stroke();
    }

    const hs = 10;
    cropCtx.fillStyle = '#06b6d4';
    [[dx, dy], [dx + dw, dy], [dx, dy + dh], [dx + dw, dy + dh]].forEach(([hx, hy]) => {
      cropCtx.fillRect(hx - hs/2, hy - hs/2, hs, hs);
    });

    cropCtx.fillStyle = 'rgba(6,182,212,0.9)';
    cropCtx.font = 'bold 11px Outfit, sans-serif';
    cropCtx.fillText('9:16', dx + 4, dy + 14);

    const pW = cropPreviewCanvas.width, pH = cropPreviewCanvas.height;
    cropPreviewCtx.clearRect(0, 0, pW, pH);
    cropPreviewCtx.drawImage(vid, cr.x, cr.y, cr.w, cr.h, 0, 0, pW, pH);

    if (!isNaN(vid.duration) && vid.duration > 0) {
      // Better looping within selection range
      if (cs.playing) {
        if (vid.currentTime >= cs.trimEnd) {
          vid.currentTime = cs.trimStart;
        } else if (vid.currentTime < cs.trimStart) {
          vid.currentTime = cs.trimStart;
        }
      }
      updateFilmstripPlayhead();
    }
    if (cs.playing) rafId = requestAnimationFrame(drawFrame);
  }

  function scheduleFrame() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(drawFrame);
  }

  async function loadVideo() {
    const fp = cropFilePathEl.value.trim();
    if (!fp) { toast('Enter a video file path', 'error'); return; }
    cropBtnLoad.textContent = 'LOADINGâ€¦';
    cropBtnLoad.disabled = true;
    try {
      const r = await fetch('/api/probe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fp })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      cs.filePath = fp; cs.srcW = d.width; cs.srcH = d.height;
      cs.duration = d.duration; cs.loaded = true;
      cs.panX = 0; cs.panY = 0; cs.zoom = 1;

      cropMetaFile.textContent = d.fileName;
      cropMetaDur.textContent  = fmtSec(d.duration);
      cropMetaRes.textContent  = `${d.width}Ã—${d.height}`;
      cropVideoMetaEl.classList.remove('hidden');
      
      const wrapper = document.getElementById('cropCanvasWrapper');
      const wW = wrapper.clientWidth || 800, wH = wrapper.clientHeight || 450;
      const aspect = cs.srcW / cs.srcH;
      let cW, cH;
      if (wW / wH > aspect) { cH = Math.min(wH, 520); cW = Math.round(cH * aspect); }
      else                  { cW = Math.min(wW, 900);  cH = Math.round(cW / aspect); }
      cropCanvas.width = cW; cropCanvas.height = cH;
      cropPreviewCanvas.width = 160; cropPreviewCanvas.height = Math.round(160 * (16/9));

      vid.src = `/api/video-stream?filePath=${encodeURIComponent(fp)}`;
      vid.load();
      cropCanvasEmpty.classList.add('hidden');
      cs.trimStart = 0;
      cs.trimEnd   = Math.min(30, cs.duration);
      cropCanvasInfo.textContent = `${d.width}\u00d7${d.height} \u00b7 ${fmtSec(d.duration)} \u00b7 ready`;

      // Wait for video to be fully loaded before seeking
      vid.addEventListener('loadedmetadata', function onMetadataLoaded() {
        vid.removeEventListener('loadedmetadata', onMetadataLoaded);
        vid.currentTime = 0;
        
        vid.addEventListener('seeked', function onFirstSeek() {
          vid.removeEventListener('seeked', onFirstSeek);
          scheduleFrame();
          toast('Video fully loaded - ready for trimming');
        });
      });

      // Add video error handling
      vid.onerror = function() {
        console.error('[Crop Studio] Video load error');
        toast('Failed to load video stream', 'error');
        cs.loaded = false;
      };

      // Show filmstrip and generate it
      filmstripSection.style.display = 'flex';
      fsExportBtn.disabled = false;
      buildFilmstrip();
      toast(`Loaded: ${d.fileName}`);
    } catch (e) {
      toast(e.message || 'Failed to load video', 'error');
    } finally {
      cropBtnLoad.textContent = '\u25b6 LOAD VIDEO';
      cropBtnLoad.disabled = false;
    }
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  FILMSTRIP ENGINE
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

  const THUMB_W = 90, THUMB_H = 68;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = THUMB_W; thumbCanvas.height = THUMB_H;
  const thumbCtx = thumbCanvas.getContext('2d');
  
  // Filmstrip cache to avoid regenerating thumbnails
  const filmstripCache = new Map();
  
  function getCacheKey(filePath, time) {
    return `${filePath}_${time.toFixed(2)}`;
  }
  
  // Helper to ensure event handlers fire only once
  function once(fn) {
    let called = false;
    return function(...args) {
      if (!called) {
        called = true;
        fn.apply(this, args);
      }
    };
  }

  // \u2500\u2500 Build time ruler \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function buildRuler(trackWidth) {
    fsRuler.innerHTML = '';
    if (!cs.duration) return;
    const dur = cs.duration;
    const intervals = [0.5, 1, 2, 5, 10, 15, 30, 60];
    const targetTicks = Math.max(4, Math.floor(trackWidth / 80));
    const interval = intervals.find(v => dur / v <= targetTicks) || 60;
    for (let t = 0; t <= dur + 0.001; t += interval) {
      const clamped = Math.min(t, dur);
      const pct = (clamped / dur) * 100;
      const tick = document.createElement('div');
      tick.className = 'fs-ruler-tick';
      tick.style.left = `${pct}%`;
      tick.innerHTML = `<span>${fmtSec(clamped)}</span>`;
      fsRuler.appendChild(tick);
    }
  }

  // \u2500\u2500 Extract frames async \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  async function buildFilmstrip() {
    const trackOuter = document.getElementById('fsTrackOuter');
    if (!trackOuter) {
      console.error('[Crop Studio] Track outer element missing');
      return;
    }
    const trackW = trackOuter.clientWidth || 800;
    const numFrames = Math.max(8, Math.floor(trackW / THUMB_W));

    buildRuler(trackW);
    fsLoading.style.display = 'flex';
    fsFrames.querySelectorAll('.fs-frame-img').forEach(el => el.remove());

    const promises = [];
    for (let i = 0; i < numFrames; i++) {
      const t = (i / (numFrames - 1)) * cs.duration;
      const cacheKey = getCacheKey(cs.filePath, t);
      const img = document.createElement('img');
      img.className = 'fs-frame-img';
      img.style.width = `${100 / numFrames}%`;
      
      // Check cache first
      if (filmstripCache.has(cacheKey)) {
        img.src = filmstripCache.get(cacheKey);
        fsFrames.insertBefore(img, fsLoading);
        promises.push(Promise.resolve());
        continue;
      }
      
      // Lazy loading: only load first 4 frames immediately, rest on demand
      if (i < 4) {
        img.src = `/api/thumbnail-at?filePath=${encodeURIComponent(cs.filePath)}&time=${t.toFixed(2)}`;
      } else {
        img.dataset.src = `/api/thumbnail-at?filePath=${encodeURIComponent(cs.filePath)}&time=${t.toFixed(2)}`;
        img.loading = 'lazy';
        img.style.background = '#0a0c12';
      }

      const p = new Promise(resolve => {
        img.onload = once(() => {
          filmstripCache.set(cacheKey, img.src);
          resolve();
        });
        img.onerror = once(() => {
          console.warn(`[Crop Studio] Failed to load thumbnail at ${t.toFixed(2)}s`);
          resolve();
        });
      });
      promises.push(p);
      fsFrames.insertBefore(img, fsLoading);
    }

    // Setup Intersection Observer for lazy loading
    const lazyImages = document.querySelectorAll('.fs-frame-img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
            imageObserver.unobserve(img);
          }
        }
      });
    }, { root: fsTrackOuter, rootMargin: '100px' });
    
    lazyImages.forEach(img => imageObserver.observe(img));

    Promise.all(promises).then(() => {
      fsLoading.style.display = 'none';
    });

    updateFilmstripUI();
  }

  // \u2500\u2500 Sync selection box, masks, tooltips, time inputs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function updateFilmstripUI() {
    if (!cs.duration) return;
    const startPct = (cs.trimStart / cs.duration) * 100;
    const endPct   = (cs.trimEnd   / cs.duration) * 100;

    fsSelection.style.left  = `${startPct}%`;
    fsSelection.style.width = `${endPct - startPct}%`;

    fsMaskLeft.style.width  = `${startPct}%`;
    fsMaskRight.style.left  = `${endPct}%`;
    fsMaskRight.style.width = `${100 - endPct}%`;

    const fmt = t => {
      const m = Math.floor(t / 60).toString().padStart(2,'0');
      const s = (t % 60).toFixed(2).padStart(5,'0');
      return `${m}:${s}`;
    };
    fsTooltipLeft.textContent  = fmt(cs.trimStart);
    fsTooltipRight.textContent = fmt(cs.trimEnd);
    fsTimeIn.value  = fmt(cs.trimStart);
    fsTimeOut.value = fmt(cs.trimEnd);
    fsDurationBadge.textContent = `${(cs.trimEnd - cs.trimStart).toFixed(2)}s`;
    updateFilmstripPlayhead();
  }

  // \u2500\u2500 Move red playhead \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function updateFilmstripPlayhead() {
    if (!cs.duration) return;
    const pct = (vid.currentTime / cs.duration) * 100;
    fsPlayhead.style.left = `${pct}%`;
    const m = Math.floor(vid.currentTime / 60).toString().padStart(2,'0');
    const s = (vid.currentTime % 60).toFixed(2).padStart(5,'0');
    fsPlayheadTime.textContent = `${m}:${s}`;
  }

  // Legacy no-op alias
  function updateTimelineUI() { updateFilmstripUI(); }

  // \u2500\u2500 Click on track to seek \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const fsTrackOuter = document.getElementById('fsTrackOuter');
  let fsScrubbing = false;
  let lastScrubX = 0;

  function handleScrubStart(e) {
    if (!cs.loaded || !cs.duration) return;
    if (e.target.closest('.fs-handle') || e.target.closest('.fs-selection')) return;
    fsScrubbing = true;
    lastScrubX = e.clientX;
    scrub(e.clientX);
    e.preventDefault();
  }

  if (fsRuler) fsRuler.addEventListener('mousedown', handleScrubStart);
  if (fsTrackOuter) fsTrackOuter.addEventListener('mousedown', handleScrubStart);

  window.addEventListener('mousemove', e => {
    if (fsScrubbing) {
      lastScrubX = e.clientX;
      scrub(e.clientX);
    }
  });

  window.addEventListener('mouseup', () => {
    if (fsScrubbing) {
      fsScrubbing = false;
      const rect = fsTrackOuter.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (lastScrubX - rect.left) / rect.width));
      vid.currentTime = pct * cs.duration;
      scheduleFrame();
    }
  });

  function scrub(clientX) {
    const rect = fsTrackOuter.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = pct * cs.duration;
    
    // Update playhead position visually immediately
    const playheadPct = pct * 100;
    fsPlayhead.style.left = `${playheadPct}%`;
    const m = Math.floor(targetTime / 60).toString().padStart(2,'0');
    const s = (targetTime % 60).toFixed(2).padStart(5,'0');
    fsPlayheadTime.textContent = `${m}:${s}`;

    // Scrub video player with seeking throttle
    if (!vid.seeking) {
      vid.currentTime = targetTime;
    }
  }

  // \u2500\u2500 Filmstrip drag (handles + box pan) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  let fsDrag = null;

  fsHandleLeft.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    fsHandleLeft.classList.add('dragging');
    const rect = fsTrackOuter.getBoundingClientRect();
    fsDrag = { type: 'left', startX: e.clientX, rect,
               startTrimStart: cs.trimStart, startTrimEnd: cs.trimEnd };
  });

  fsHandleRight.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    fsHandleRight.classList.add('dragging');
    const rect = fsTrackOuter.getBoundingClientRect();
    fsDrag = { type: 'right', startX: e.clientX, rect,
               startTrimStart: cs.trimStart, startTrimEnd: cs.trimEnd };
  });

  fsSelection.addEventListener('mousedown', e => {
    if (e.target.closest('.fs-handle')) return;
    e.stopPropagation(); e.preventDefault();
    const rect = fsTrackOuter.getBoundingClientRect();
    fsDrag = { type: 'box', startX: e.clientX, rect,
               startTrimStart: cs.trimStart, startTrimEnd: cs.trimEnd };
    fsSelection.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!fsDrag || !cs.loaded || !cs.duration) return;
    const dx    = e.clientX - fsDrag.startX;
    const dTime = (dx / fsDrag.rect.width) * cs.duration;
    const MIN   = 0.1; // Reduced minimum for more precise trimming
    
    // Snap-to-duration thresholds (in seconds)
    const SNAP_THRESHOLDS = [5, 15, 20, 30, 60];
    const SNAP_TOLERANCE = 0.5; // Snap within 0.5s of target

    if (fsDrag.type === 'left') {
      let newStart = Math.max(0, Math.min(fsDrag.startTrimEnd - MIN, fsDrag.startTrimStart + dTime));
      
      // Snap to duration from start
      if (e.shiftKey) {
        const currentDuration = fsDrag.startTrimEnd - newStart;
        for (const target of SNAP_THRESHOLDS) {
          if (Math.abs(currentDuration - target) < SNAP_TOLERANCE) {
            newStart = fsDrag.startTrimEnd - target;
            break;
          }
        }
      }
      
      cs.trimStart = parseFloat(newStart.toFixed(3));
      // Immediate seeking for robust responsiveness
      vid.currentTime = cs.trimStart;
    } else if (fsDrag.type === 'right') {
      let newEnd = Math.min(cs.duration, Math.max(fsDrag.startTrimStart + MIN, fsDrag.startTrimEnd + dTime));
      
      // Snap to duration from start
      if (e.shiftKey) {
        const currentDuration = newEnd - fsDrag.startTrimStart;
        for (const target of SNAP_THRESHOLDS) {
          if (Math.abs(currentDuration - target) < SNAP_TOLERANCE) {
            newEnd = fsDrag.startTrimStart + target;
            break;
          }
        }
      }
      
      cs.trimEnd = parseFloat(newEnd.toFixed(3));
      // Immediate seeking for robust responsiveness
      vid.currentTime = cs.trimEnd;
    } else if (fsDrag.type === 'box') {
      const len = fsDrag.startTrimEnd - fsDrag.startTrimStart;
      let ns = Math.max(0, Math.min(cs.duration - len, fsDrag.startTrimStart + dTime));
      
      // Snap to duration when dragging box with Shift
      if (e.shiftKey) {
        const currentDuration = len;
        for (const target of SNAP_THRESHOLDS) {
          if (Math.abs(currentDuration - target) < SNAP_TOLERANCE) {
            // Adjust to match target duration
            const newLen = target;
            ns = Math.max(0, Math.min(cs.duration - newLen, ns));
            break;
          }
        }
      }
      
      cs.trimStart = parseFloat(ns.toFixed(3));
      cs.trimEnd   = parseFloat((ns + len).toFixed(3));
      // Immediate seeking for robust responsiveness
      vid.currentTime = cs.trimStart;
    }
    updateFilmstripUI();
  });

  window.addEventListener('mouseup', () => {
    if (fsDrag) {
      fsHandleLeft.classList.remove('dragging');
      fsHandleRight.classList.remove('dragging');
      fsSelection.style.cursor = '';
      // Snap video player to exact final position
      if (fsDrag.type === 'right') {
        vid.currentTime = cs.trimEnd;
      } else {
        vid.currentTime = cs.trimStart;
      }
      fsDrag = null;
      scheduleFrame();
    }
  });

  // -- Hover Preview on Timeline ---------------------------------------------------
  const fsHoverPreview = document.getElementById('fsHoverPreview');
  const fsHoverPreviewImg = document.getElementById('fsHoverPreviewImg');
  const fsHoverTime = document.getElementById('fsHoverTime');
  let hoverPreviewTimeout = null;
  let lastHoverTime = null;

  if (fsTrackOuter && fsHoverPreview) {
    fsTrackOuter.addEventListener('mousemove', e => {
      if (!cs.loaded || !cs.duration || fsDrag) return;
      
      const rect = fsTrackOuter.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const time = pct * cs.duration;
      
      // Debounce preview updates
      if (hoverPreviewTimeout) clearTimeout(hoverPreviewTimeout);
      
      hoverPreviewTimeout = setTimeout(() => {
        // Only update if time changed significantly
        if (lastHoverTime === null || Math.abs(time - lastHoverTime) > 0.1) {
          lastHoverTime = time;
          
          // Update preview image
          const cacheKey = getCacheKey(cs.filePath, time);
          if (filmstripCache.has(cacheKey)) {
            fsHoverPreviewImg.src = filmstripCache.get(cacheKey);
          } else {
            fsHoverPreviewImg.src = `/api/thumbnail-at?filePath=${encodeURIComponent(cs.filePath)}&time=${time.toFixed(2)}`;
          }
          
          // Update time display
          const m = Math.floor(time / 60).toString().padStart(2,'0');
          const s = (time % 60).toFixed(2).padStart(5,'0');
          fsHoverTime.textContent = `${m}:${s}`;
          
          // Position tooltip
          fsHoverPreview.style.left = `${x}px`;
          fsHoverPreview.classList.add('visible');
        }
      }, 50);
    });

    fsTrackOuter.addEventListener('mouseleave', () => {
      if (hoverPreviewTimeout) clearTimeout(hoverPreviewTimeout);
      fsHoverPreview.classList.remove('visible');
      lastHoverTime = null;
    });
  }

  // -- Editable IN/OUT text inputs ------------------------------------------
  function parseTime(val) {
    if (!val) return NaN;
    val = val.trim();
    
    // Handle MM:SS format
    if (val.includes(':')) {
      const parts = val.split(':');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const sec = parseFloat(parts[1]);
        if (!isNaN(min) && !isNaN(sec)) return min * 60 + sec;
      }
      // Handle HH:MM:SS format
      if (parts.length === 3) {
        const hr = parseFloat(parts[0]);
        const min = parseFloat(parts[1]);
        const sec = parseFloat(parts[2]);
        if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) return hr * 3600 + min * 60 + sec;
      }
    }
    
    // Handle decimal seconds (e.g., "2.5" or "2,5")
    const normalized = val.replace(',', '.');
    const sec = parseFloat(normalized);
    return isNaN(sec) ? NaN : sec;
  }

  fsTimeIn.addEventListener('change', () => {
    const t = parseTime(fsTimeIn.value);
    if (!isNaN(t) && t >= 0 && t < cs.trimEnd - 0.1) {
      cs.trimStart = parseFloat(t.toFixed(3));
      vid.currentTime = cs.trimStart;
      updateFilmstripUI();
      scheduleFrame();
    } else {
      updateFilmstripUI(); // revert to current In point on error
      toast('Invalid start time (must be at least 0.1s before end)', 'error');
    }
  });

  fsTimeOut.addEventListener('change', () => {
    const t = parseTime(fsTimeOut.value);
    if (!isNaN(t) && t > cs.trimStart + 0.1 && t <= cs.duration) {
      cs.trimEnd = parseFloat(t.toFixed(3));
      vid.currentTime = cs.trimEnd;
      updateFilmstripUI();
      scheduleFrame();
    } else {
      updateFilmstripUI(); // revert to current Out point on error
      toast('Invalid end time (must be at least 0.1s after start)', 'error');
    }
  });

  // \u2500\u2500 Old-style drag-to-pan on canvas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  cropCanvas.addEventListener('mousedown', e => {
    if (!cs.loaded) return;
    cs.drag.active = true; cs.drag.startX = e.clientX; cs.drag.startY = e.clientY;
    cs.drag.origPanX = cs.panX; cs.drag.origPanY = cs.panY;
    cropCanvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!cs.drag.active) return;
    const cr = getCropRect();
    const maxOffX = (cs.srcW - cr.w) / 2, maxOffY = (cs.srcH - cr.h) / 2;
    const scX = cs.srcW / cropCanvas.width, scY = cs.srcH / cropCanvas.height;
    if (maxOffX > 0) cs.panX = Math.max(-1, Math.min(1, cs.drag.origPanX + ((e.clientX - cs.drag.startX) * scX) / maxOffX));
    if (maxOffY > 0) cs.panY = Math.max(-1, Math.min(1, cs.drag.origPanY + ((e.clientY - cs.drag.startY) * scY) / maxOffY));
    cropXSlider.value = cs.panX; cropYSlider.value = cs.panY;
    cropXVal.textContent = cs.panX === 0 ? 'Center' : `${(cs.panX*100).toFixed(0)}%`;
    cropYVal.textContent = cs.panY === 0 ? 'Center' : `${(cs.panY*100).toFixed(0)}%`;
    scheduleFrame();
  });
  window.addEventListener('mouseup', () => { cs.drag.active = false; cropCanvas.style.cursor = ''; });

  // \u2500\u2500 Sliders \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  cropXSlider.addEventListener('input', () => { cs.panX = parseFloat(cropXSlider.value); cropXVal.textContent = cs.panX === 0 ? 'Center' : `${(cs.panX*100).toFixed(0)}%`; scheduleFrame(); });
  cropYSlider.addEventListener('input', () => { cs.panY = parseFloat(cropYSlider.value); cropYVal.textContent = cs.panY === 0 ? 'Center' : `${(cs.panY*100).toFixed(0)}%`; scheduleFrame(); });
  cropZoomSlider.addEventListener('input', () => { cs.zoom = parseFloat(cropZoomSlider.value); cropZoomVal.textContent = `${cs.zoom.toFixed(2)}\u00d7`; scheduleFrame(); });

  // \u2500\u2500 Play / Pause \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  cropBtnPlayPause.addEventListener('click', () => {
    if (!cs.loaded) return;
    if (cs.playing) {
      vid.pause(); cs.playing = false; cropBtnPlayPause.textContent = '\u25b6 Play';
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      if (vid.currentTime < cs.trimStart || vid.currentTime >= cs.trimEnd) vid.currentTime = cs.trimStart;
      vid.play(); cs.playing = true; cropBtnPlayPause.textContent = '\u23f8 Pause';
      rafId = requestAnimationFrame(drawFrame);
    }
  });
  vid.addEventListener('ended', () => {
    cs.playing = false; cropBtnPlayPause.textContent = '\u25b6 Play';
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    scheduleFrame();
  });

  // \u2500\u2500 Keep Clip \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  fsKeepBtn.addEventListener('click', () => {
    if (!cs.loaded) return;
    const fmt = t => {
      const m = Math.floor(t/60).toString().padStart(2,'0');
      const s = (t%60).toFixed(1).padStart(4,'0');
      return `${m}:${s}`;
    };
    toast(`\u2702 Kept: ${fmt(cs.trimStart)} \u2192 ${fmt(cs.trimEnd)} (${(cs.trimEnd-cs.trimStart).toFixed(1)}s)`);
    fsSelection.style.outline = '2px solid #22c55e';
    setTimeout(() => { fsSelection.style.outline = ''; }, 800);
  });

  // \u2500\u2500 Remove Clip (advance selection window past current segment) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  fsRemoveBtn.addEventListener('click', () => {
    if (!cs.loaded) return;
    const len = cs.trimEnd - cs.trimStart;
    const newStart = Math.min(cs.duration - len, cs.trimEnd);
    cs.trimStart = parseFloat(Math.max(0, newStart).toFixed(2));
    cs.trimEnd   = parseFloat(Math.min(cs.duration, cs.trimStart + len).toFixed(2));
    vid.currentTime = cs.trimStart;
    updateFilmstripUI();
    fsSelection.style.outline = '2px solid #ef4444';
    setTimeout(() => { fsSelection.style.outline = ''; }, 600);
    toast('\u2715 Segment skipped \u2014 selection advanced');
  });

  // -- Duration Presets -----------------------------------------------------------
  const presetBtns = document.querySelectorAll('.fs-preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!cs.loaded) return;
      const duration = parseFloat(btn.dataset.duration);
      setDurationFromStart(duration);
      
      // Update active state
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // -- Custom Duration Input -----------------------------------------------------
  const fsCustomDuration = document.getElementById('fsCustomDuration');
  const fsSetCustomDuration = document.getElementById('fsSetCustomDuration');
  
  if (fsSetCustomDuration) {
    fsSetCustomDuration.addEventListener('click', () => {
      if (!cs.loaded) return;
      const duration = parseFloat(fsCustomDuration.value);
      if (isNaN(duration) || duration <= 0) {
        toast('Please enter a valid duration', 'error');
        return;
      }
      if (duration > cs.duration) {
        toast(`Duration cannot exceed video length (${cs.duration.toFixed(1)}s)`, 'error');
        return;
      }
      setDurationFromStart(duration);
      
      // Remove active state from presets
      presetBtns.forEach(b => b.classList.remove('active'));
      toast(`Custom duration set: ${duration}s`);
    });

    fsCustomDuration.addEventListener('keydown', e => {
      if (e.key === 'Enter') fsSetCustomDuration.click();
    });
  }

  // -- Set Duration From Current Position -----------------------------------------
  const fsSetFromCurrent = document.getElementById('fsSetFromCurrent');
  if (fsSetFromCurrent) {
    fsSetFromCurrent.addEventListener('click', () => {
      if (!cs.loaded) return;
      const currentDuration = cs.trimEnd - cs.trimStart;
      cs.trimStart = parseFloat(vid.currentTime.toFixed(3));
      cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + currentDuration).toFixed(3));
      
      // Ensure minimum duration
      if (cs.trimEnd - cs.trimStart < 0.1) {
        cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + 0.1).toFixed(3));
      }
      
      vid.currentTime = cs.trimStart;
      updateFilmstripUI();
      scheduleFrame();
      toast(`Duration moved to: ${cs.trimStart.toFixed(2)}s`);
    });
  }

  // Helper function to set duration from current trim start
  function setDurationFromStart(duration) {
    cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + duration).toFixed(3));
    
    // If duration exceeds video, adjust start instead
    if (cs.trimEnd >= cs.duration) {
      cs.trimStart = parseFloat(Math.max(0, cs.duration - duration).toFixed(3));
      cs.trimEnd = cs.duration;
    }
    
    vid.currentTime = cs.trimStart;
    updateFilmstripUI();
    scheduleFrame();
    toast(`Duration set: ${duration}s`);
  }

  // -- Quick Trim & Export Buttons -------------------------------------------------
  const trimBtns = document.querySelectorAll('.fs-trim-btn');
  trimBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!cs.loaded) {
        toast('Please load a video first', 'error');
        return;
      }
      
      const duration = parseFloat(btn.dataset.trimDuration);
      const folder = btn.dataset.folder;
      
      // Set duration from current position
      cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + duration).toFixed(3));
      
      // If duration exceeds video, adjust start instead
      if (cs.trimEnd >= cs.duration) {
        cs.trimStart = parseFloat(Math.max(0, cs.duration - duration).toFixed(3));
        cs.trimEnd = cs.duration;
      }
      
      vid.currentTime = cs.trimStart;
      updateFilmstripUI();
      scheduleFrame();
      
      // Immediately export to the specified folder
      await exportToFolder(folder);
    });
  });

  // Helper function to export to a specific folder
  async function exportToFolder(folder) {
    const startSec = cs.trimStart;
    const duration = cs.trimEnd - cs.trimStart;
    const cr  = getCropRect();
    const cropX = Math.round(cr.x / 2) * 2;
    const cropY = Math.round(cr.y / 2) * 2;
    const cropW = Math.round(cr.w / 2) * 2;
    const cropH = Math.round(cr.h / 2) * 2;

    // Validate crop dimensions before export
    if (duration <= 0) {
      toast('Invalid duration: selection must be positive', 'error');
      return;
    }
    if (cropW <= 0 || cropH <= 0) {
      toast('Invalid crop dimensions: zoom level too high', 'error');
      return;
    }
    if (cropW > cs.srcW || cropH > cs.srcH) {
      toast('Invalid crop: dimensions exceed source video', 'error');
      return;
    }
    if (startSec < 0 || startSec >= cs.duration) {
      toast('Invalid start time: outside video duration', 'error');
      return;
    }

    // Disable all trim buttons during export
    trimBtns.forEach(b => b.disabled = true);
    fsExportBtn.disabled = true;
    cropRenderStatus.classList.remove('hidden');
    cropResultCard.classList.add('hidden');
    cropProgressFill.style.width = '0%';
    cropStatusText.textContent = `Trimming to ${folder} folder\u2026`;

    try {
      const r = await fetch('/api/crop-render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filePath: cs.filePath, 
          startSec, 
          duration, 
          cropX, 
          cropY, 
          cropW, 
          cropH, 
          srcW: cs.srcW, 
          srcH: cs.srcH, 
          fitMode: cs.fitMode, 
          format: fsFormatSelect.value,
          outputFolder: folder 
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await pollCropRender(d.batchId);
      toast(`Successfully trimmed to ${folder} folder!`);
    } catch (e) {
      toast(e.message || 'Render failed', 'error');
      cropStatusText.textContent = `Error: ${e.message}`;
    } finally {
      trimBtns.forEach(b => b.disabled = false);
      fsExportBtn.disabled = false;
    }
  }

  // \u2500\u2500 Reset Crop \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const cropBtnReset = document.getElementById('cropBtnReset');
  if (cropBtnReset) {
    cropBtnReset.addEventListener('click', () => {
      cs.panX = 0; cs.panY = 0; cs.zoom = 1;
      cropXSlider.value = 0; cropYSlider.value = 0; cropZoomSlider.value = 1;
      cropXVal.textContent = 'Center'; cropYVal.textContent = 'Center'; cropZoomVal.textContent = '1.00\u00d7';
      if (cs.loaded) {
        cs.trimStart = 0; cs.trimEnd = Math.min(30, cs.duration);
        vid.currentTime = 0;
        updateFilmstripUI();
      }
      scheduleFrame();
    });
  }

  // \u2500\u2500 Fit mode \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  [cropFitBlur, cropFitCrop].forEach(btn => {
    btn.addEventListener('click', () => {
      [cropFitBlur, cropFitCrop].forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); cs.fitMode = btn.dataset.cropfit;
    });
  });

  // \u2500\u2500 Browse \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  cropBtnBrowse.addEventListener('click', async () => {
    cropBtnBrowse.textContent = '\u2026'; cropBtnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (d.filePath) cropFilePathEl.value = d.filePath;
    } catch {}
    cropBtnBrowse.textContent = 'BROWSE'; cropBtnBrowse.disabled = false;
  });
  cropFilePathEl.addEventListener('keydown', e => { if (e.key === 'Enter') loadVideo(); });
  cropBtnLoad.addEventListener('click', loadVideo);

  // \u2500\u2500 Export (filmstrip) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  fsExportBtn.addEventListener('click', async () => {
    if (!cs.loaded) return;
    const startSec = cs.trimStart;
    const duration = cs.trimEnd - cs.trimStart;
    const cr  = getCropRect();
    const cropX = Math.round(cr.x / 2) * 2;
    const cropY = Math.round(cr.y / 2) * 2;
    const cropW = Math.round(cr.w / 2) * 2;
    const cropH = Math.round(cr.h / 2) * 2;

    // Validate crop dimensions before export
    if (duration <= 0) {
      toast('Invalid duration: selection must be positive', 'error');
      return;
    }
    if (cropW <= 0 || cropH <= 0) {
      toast('Invalid crop dimensions: zoom level too high', 'error');
      return;
    }
    if (cropW > cs.srcW || cropH > cs.srcH) {
      toast('Invalid crop: dimensions exceed source video', 'error');
      return;
    }
    if (startSec < 0 || startSec >= cs.duration) {
      toast('Invalid start time: outside video duration', 'error');
      return;
    }

    fsExportBtn.disabled = true;
    cropRenderStatus.classList.remove('hidden');
    cropResultCard.classList.add('hidden');
    cropProgressFill.style.width = '0%';
    cropStatusText.textContent = 'Queuing render\u2026';

    try {
      const r = await fetch('/api/crop-render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: cs.filePath, startSec, duration, cropX, cropY, cropW, cropH, srcW: cs.srcW, srcH: cs.srcH, fitMode: cs.fitMode, format: fsFormatSelect.value })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await pollCropRender(d.batchId);
    } catch (e) {
      toast(e.message || 'Render failed', 'error');
      cropStatusText.textContent = `Error: ${e.message}`;
    } finally {
      fsExportBtn.disabled = false;
    }
  });

  async function pollCropRender(batchId) {
    return new Promise((resolve, reject) => {
      const iv = setInterval(async () => {
        try {
          const r = await fetch(`/api/status/${batchId}`);
          const d = await r.json();
          const job = d.jobs?.[0];
          if (!job) return;
          cropProgressFill.style.width = `${job.progress || 0}%`;
          cropStatusText.textContent = typeof job.status === 'string' ? job.status : 'Rendering\u2026';
          if (job.status === 'completed') {
            clearInterval(iv);
            cropProgressFill.style.width = '100%';
            cropStatusText.textContent = '\u2705 Done!';
            cropResultCard.classList.remove('hidden');
            cropResultLink.href = job.outputPath;
            cropResultLink.textContent = `\u25b6 ${job.outputFileName}`;
            toast('Crop render complete!');
            loadHistory();
            resolve();
          } else if (job.status === 'failed') {
            clearInterval(iv); reject(new Error(job.error || 'Render failed'));
          }
        } catch (e) { clearInterval(iv); reject(e); }
      }, 700);
    });
  }

  // Cleanup function to prevent memory leaks
  cleanupCropStudio = function() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (vid) {
      vid.pause();
      vid.src = '';
      vid.load();
    }
    cs.playing = false;
    cs.loaded = false;
  };

  // -- Keyboard controls for precision trimming ---------------------------------
  document.addEventListener('keydown', e => {
    if (!cs.loaded || document.activeElement.tagName === 'INPUT') return;
    
    const SHIFT_MOD = e.shiftKey ? 0.5 : 0.05; // Shift for larger jumps
    const ALT_MOD = e.altKey ? 0.001 : SHIFT_MOD; // Alt for frame-level precision
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        vid.currentTime = Math.max(0, vid.currentTime - ALT_MOD);
        break;
      case 'ArrowRight':
        e.preventDefault();
        vid.currentTime = Math.min(cs.duration, vid.currentTime + ALT_MOD);
        break;
      case 'ArrowUp':
        e.preventDefault();
        cs.trimStart = Math.max(0, Math.min(cs.trimEnd - 0.1, cs.trimStart - ALT_MOD));
        cs.trimStart = parseFloat(cs.trimStart.toFixed(3));
        vid.currentTime = cs.trimStart;
        updateFilmstripUI();
        scheduleFrame();
        break;
      case 'ArrowDown':
        e.preventDefault();
        cs.trimStart = Math.max(0, Math.min(cs.trimEnd - 0.1, cs.trimStart + ALT_MOD));
        cs.trimStart = parseFloat(cs.trimStart.toFixed(3));
        vid.currentTime = cs.trimStart;
        updateFilmstripUI();
        scheduleFrame();
        break;
      case ' ':
        e.preventDefault();
        cropBtnPlayPause.click();
        break;
      case 'i':
      case 'I':
        e.preventDefault();
        cs.trimStart = parseFloat(vid.currentTime.toFixed(3));
        if (cs.trimStart >= cs.trimEnd - 0.1) {
          cs.trimEnd = Math.min(cs.duration, cs.trimStart + 0.1);
        }
        updateFilmstripUI();
        scheduleFrame();
        toast(`In point set: ${cs.trimStart.toFixed(2)}s`);
        break;
      case 'o':
      case 'O':
        e.preventDefault();
        cs.trimEnd = parseFloat(vid.currentTime.toFixed(3));
        if (cs.trimEnd <= cs.trimStart + 0.1) {
          cs.trimStart = Math.max(0, cs.trimEnd - 0.1);
        }
        updateFilmstripUI();
        scheduleFrame();
        toast(`Out point set: ${cs.trimEnd.toFixed(2)}s`);
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        cs.trimStart = 0;
        cs.trimEnd = Math.min(30, cs.duration);
        vid.currentTime = 0;
        updateFilmstripUI();
        scheduleFrame();
        toast('Trim range reset');
        break;
    }
  });
}

// -- Random Clips Generator -----------------------------------------------------
function initRandomGen() {
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
  
  // Pre-selection review DOM elements
  const randomProposedSection = $('randomProposedSection');
  const randomProposedList = $('randomProposedList');
  const randomPreviewPlayer = $('randomPreviewPlayer');
  const randomBtnStartRender = $('randomBtnStartRender');
  
  // Panning elements
  const randomPanSlider = $('randomPanSlider');
  const randomPanVal = $('randomPanVal');
  const randomPanAdjusterGroup = $('randomPanAdjusterGroup');
  
  // Library elements
  const randomBtnRefreshLibrary = $('randomBtnRefreshLibrary');
  const randomLibraryList = $('randomLibraryList');
  
  // Timeline elements
  const randomTimelineContainer = $('randomTimelineContainer');
  const randomTimelineTrack = $('randomTimelineTrack');
  const randomTimelineDurationLabel = $('randomTimelineDurationLabel');
  
  let randomMediaInfo = null;
  let selectedDuration = 5;
  let proposedClips = [];
  let currentPreviewIndex = 0;

  // Manual Cutter state
  let manualQueue = [];
  let manualStartSec = null;
  let manualDurSec = 5;
  let manualMediaPath = null;
  let manualPanValue = 0;  // -1 = full left, 0 = center, 1 = full right
  let selectedQueueIndex = -1; // -1 means editing NEW CLIP, >= 0 means editing queued clip index

  // Duration button selection
  const durBtns = document.querySelectorAll('.random-dur-btn');
  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDuration = parseInt(btn.dataset.duration);
    });
  });

  // Browse file
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

  // Probe file
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

  // ─── MANUAL CLIP CUTTER ────────────────────────────────────────────────────

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

    // Hide placeholder once video loads
    player.addEventListener('loadeddata', () => {
      const ph = $('manualCropPreviewPlaceholder');
      if (ph) ph.style.display = 'none';
      updateCropVisualization(0);
    });

    // Sync scrubber → player + update crop preview
    scrubber.addEventListener('input', () => {
      player.currentTime = parseFloat(scrubber.value);
      timeDisplay.textContent = fmtTime(player.currentTime);
    });
    // Sync player → scrubber while playing + refresh preview frame
    player.addEventListener('timeupdate', () => {
      if (!scrubber.matches(':active')) {
        scrubber.value = player.currentTime;
        timeDisplay.textContent = fmtTime(player.currentTime);
      }
    });
    // Redraw 9:16 preview whenever the video seeks to a new frame
    player.addEventListener('seeked', () => {
      const pan = (selectedQueueIndex === -1) ? manualPanValue : (manualQueue[selectedQueueIndex] ? manualQueue[selectedQueueIndex].pan : 0);
      updateCropVisualization(pan);
    });

    // Alignment is now per-clip inside queue items, no global slider needed
  }

  // ─── INTERACTIVE ALIGNMENT STATION WIRING ────────────────────────────
  const manualAlignLabel = $('manualAlignLabel');
  const manualPanVal     = $('manualPanVal');
  const manualPanSlider  = $('manualPanSlider');
  const manualSnapL      = $('manualSnapL');
  const manualSnapC      = $('manualSnapC');
  const manualSnapR      = $('manualSnapR');

  function updateAlignStationUI(pan) {
    if (!manualPanSlider || !manualPanVal || !manualAlignLabel) return;
    
    manualPanSlider.value = pan;

    // Label text & colors
    if (Math.abs(pan) < 0.05) {
      manualPanVal.textContent = 'Center';
      manualPanVal.style.color = 'var(--accent-purple)';
      manualPanVal.style.background = 'rgba(168,85,247,0.1)';
    } else if (pan < 0) {
      manualPanVal.textContent = `Left ${Math.abs(Math.round(pan * 100))}%`;
      manualPanVal.style.color = 'var(--accent-cyan)';
      manualPanVal.style.background = 'rgba(6,182,212,0.1)';
    } else {
      manualPanVal.textContent = `Right ${Math.round(pan * 100)}%`;
      manualPanVal.style.color = 'var(--accent-cyan)';
      manualPanVal.style.background = 'rgba(6,182,212,0.1)';
    }

    if (selectedQueueIndex === -1) {
      manualAlignLabel.textContent = '↔ CROP ALIGNMENT (NEW CLIP)';
      manualAlignLabel.style.color = 'var(--accent-cyan)';
    } else {
      manualAlignLabel.textContent = `↔ CROP ALIGNMENT (EDITING CLIP #${selectedQueueIndex + 1})`;
      manualAlignLabel.style.color = 'var(--accent-purple)';
    }

    // Toggle active state on buttons
    manualSnapL.classList.toggle('active-cyan', pan <= -0.9);
    manualSnapC.classList.toggle('active-purple', Math.abs(pan) < 0.12);
    manualSnapR.classList.toggle('active-cyan', pan >= 0.9);

    // Update video preview canvas overlay and portrait preview
    updateCropVisualization(pan);
  }

  function handleAlignmentChange(pan) {
    if (selectedQueueIndex === -1) {
      manualPanValue = pan;
    } else {
      if (manualQueue[selectedQueueIndex]) {
        manualQueue[selectedQueueIndex].pan = pan;
        // Dynamically update the specific queue item's badge without complete rerender
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

  if (manualPanSlider) {
    manualPanSlider.addEventListener('input', () => {
      handleAlignmentChange(parseFloat(manualPanSlider.value));
    });
    // Double click resets slider to center
    manualPanSlider.addEventListener('dblclick', () => {
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

  // SET START POINT button
  const manualBtnSetStart = $('manualBtnSetStart');
  if (manualBtnSetStart) {
    manualBtnSetStart.addEventListener('click', () => {
      const player = $('manualPreviewPlayer');
      if (!player.src || player.src === window.location.href) {
        toast('Analyze a video first', 'error'); return;
      }
      manualStartSec = player.currentTime;
      $('manualStartDisplay').textContent = fmtTime(manualStartSec);
      // Flash the badge
      manualBtnSetStart.textContent = '✅ START SET';
      setTimeout(() => { manualBtnSetStart.textContent = '📍 SET START'; }, 1200);
      toast(`Start set: ${fmtTime(manualStartSec)}`);
    });
  }

  // Manual duration buttons
  const manualDurBtns = document.querySelectorAll('.manual-dur-btn');
  manualDurBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      manualDurBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      manualDurSec = parseInt(btn.dataset.dur);
    });
  });

  // ADD TO QUEUE button
  const manualBtnAddClip = $('manualBtnAddClip');
  if (manualBtnAddClip) {
    manualBtnAddClip.addEventListener('click', () => {
      if (manualStartSec === null) {
        toast('Set a START POINT first using the scrubber', 'error'); return;
      }
      if (!manualMediaPath) {
        toast('Analyze a video first', 'error'); return;
      }
      // Add clip with current alignment settings
      manualQueue.push({ start: manualStartSec, duration: manualDurSec, pan: manualPanValue });
      
      // Auto-select the newly added clip so the user can tweak it immediately
      selectedQueueIndex = manualQueue.length - 1;
      
      renderManualQueue();
      
      // Update UI for the selected clip
      updateAlignStationUI(manualQueue[selectedQueueIndex].pan);

      toast(`Clip #${manualQueue.length} added & selected for alignment!`);
    });
  }

  // CLEAR ALL button
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
      // If selected, add selected class
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

      // Select row on click (except delete button)
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('mqi-remove')) return;
        
        selectedQueueIndex = i;
        
        // Remove selection style from other rows, add to this one
        document.querySelectorAll('.manual-queue-item').forEach(row => row.classList.remove('selected'));
        item.classList.add('selected');

        // Sync player state & seek
        const player = $('manualPreviewPlayer');
        const scrubber = $('manualScrubber');
        player.currentTime = clip.start;
        scrubber.value = clip.start;
        $('manualCurrentTime').textContent = fmtTime(clip.start);

        // Update alignment station to this clip's pan
        updateAlignStationUI(clip.pan);
        
        toast(`Editing alignment for Clip #${i+1}`);
      });

      // Play clip
      item.querySelector('.mqi-preview').addEventListener('click', (e) => {
        e.stopPropagation(); // prevent double triggering select
        
        // Mark as selected
        selectedQueueIndex = i;
        document.querySelectorAll('.manual-queue-item').forEach(row => row.classList.remove('selected'));
        item.classList.add('selected');

        // Update alignment controls
        updateAlignStationUI(clip.pan);

        const player  = $('manualPreviewPlayer');
        const scrubber = $('manualScrubber');
        player.currentTime = clip.start;
        scrubber.value = clip.start;
        $('manualCurrentTime').textContent = fmtTime(clip.start);
        
        player.play();
        setTimeout(() => player.pause(), clip.duration * 1000);
      });

      // Remove item
      item.querySelector('.mqi-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        manualQueue.splice(i, 1);
        
        // Adjust selected index
        if (selectedQueueIndex === i) {
          selectedQueueIndex = -1; // reset to configure new clip
          updateAlignStationUI(0);
        } else if (selectedQueueIndex > i) {
          selectedQueueIndex--;
        }
        
        renderManualQueue();
      });

      list.appendChild(item);
    });
  }


  randomFilePath.addEventListener('keydown', e => {
    if (e.key === 'Enter') randomBtnProbe.click();
  });

  // ─── MANUAL CLIP CUTTER ────────────────────────────────────────────────────

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

    // Hide placeholder once video loads
    player.addEventListener('loadeddata', () => {
      const ph = $('manualCropPreviewPlaceholder');
      if (ph) ph.style.display = 'none';
      updateCropVisualization(0);
    });

    // Sync scrubber → player + update crop preview
    scrubber.addEventListener('input', () => {
      player.currentTime = parseFloat(scrubber.value);
      timeDisplay.textContent = fmtTime(player.currentTime);
    });
    // Sync player → scrubber while playing + refresh preview frame
    player.addEventListener('timeupdate', () => {
      if (!scrubber.matches(':active')) {
        scrubber.value = player.currentTime;
        timeDisplay.textContent = fmtTime(player.currentTime);
      }
    });
    // Redraw 9:16 preview whenever the video seeks to a new frame
    player.addEventListener('seeked', () => updateCropVisualization(manualPanValue));

    // Alignment is now per-clip inside queue items, no global slider needed
  }

  // ─── CROP VISUALIZATION ENGINE ─────────────────────────────────────────────
  // Draws: (1) crop-window overlay on the landscape player
  //        (2) live 9:16 portrait canvas of the exact cropped output

  function updateCropVisualization(pan) {
    if (!randomMediaInfo) return;

    const video      = $('manualPreviewPlayer');
    const overlayC   = $('manualCropOverlay');
    const previewC   = $('manualCropPreview');
    if (!overlayC || !previewC) return;

    const srcW = randomMediaInfo.width;
    const srcH = randomMediaInfo.height;

    // Compute 9:16 crop dimensions in source space
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

    // ── 1. Landscape overlay: dark masks + cyan crop-window border ──────────
    const cW = overlayC.offsetWidth;
    const cH = overlayC.offsetHeight;
    overlayC.width  = cW;
    overlayC.height = cH;
    const ctx = overlayC.getContext('2d');
    ctx.clearRect(0, 0, cW, cH);

    // Where is the video rendered inside the container (object-fit: contain)?
    const aspect = srcW / srcH;
    let vW = cW, vH = cW / aspect;
    if (vH > cH) { vH = cH; vW = cH * aspect; }
    const vX = (cW - vW) / 2;
    const vY = (cH - vH) / 2;

    // Crop window in display coords
    const dLeft = vX + (cropX / srcW) * vW;
    const dCropW = (cropW / srcW) * vW;

    // Dark overlay on the non-crop areas
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(vX, vY, dLeft - vX, vH);                       // left strip
    ctx.fillRect(dLeft + dCropW, vY, (vX + vW) - (dLeft + dCropW), vH); // right strip

    // Cyan crop-window border
    ctx.strokeStyle = 'rgba(6,182,212,0.95)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dLeft + 1, vY + 1, dCropW - 2, vH - 2);

    // Corner accent marks (like a viewfinder)
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

    // "9:16" label centered in the crop window
    ctx.fillStyle = 'rgba(6,182,212,0.85)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('9:16', dLeft + dCropW/2, vY + vH - 6);

    // ── 2. Portrait preview canvas: actual cropped frame ────────────────────
    if (video.readyState >= 2) {
      const pCtx = previewC.getContext('2d');
      pCtx.clearRect(0, 0, previewC.width, previewC.height);
      try {
        pCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, previewC.width, previewC.height);
      } catch(e) { /* video not ready yet */ }

      // Subtle vignette
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



  // RENDER MANUAL CLIPS button
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

      // Base crop dimensions from source (computed once, pan offsets cropX per clip)
      const srcW = randomMediaInfo.width;
      const srcH = randomMediaInfo.height;
      let baseCropW, baseCropH, baseCropY, maxCropX;
      if (srcW > srcH) {
        // Landscape: portrait center-slice
        baseCropH = srcH;
        baseCropW = Math.round((srcH * 9) / 16);
        baseCropY = 0;
        maxCropX = srcW - baseCropW;  // max left-offset
      } else {
        // Portrait/square: full frame
        baseCropW = srcW;
        baseCropH = srcH;
        baseCropY = 0;
        maxCropX = 0;
      }
      // Ensure even numbers (FFmpeg requirement)
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

        // Compute cropX from this clip's saved pan value
        // pan=−1 → cropX=0 (full left), pan=0 → cropX=center, pan=+1 → cropX=maxCropX (full right)
        const clipPan = clip.pan || 0;
        const centerX = Math.round((srcW - baseCropW) / 2);
        let clipCropX;
        if (clipPan < 0) {
          // left of center
          clipCropX = Math.round(centerX * (1 + clipPan)); // pan=-1 → 0
        } else {
          // right of center
          clipCropX = Math.round(centerX + clipPan * (maxCropX - centerX)); // pan=1 → maxCropX
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

          // Poll until done — crop-render uses activeBatches[batchId].jobs[0]
          await new Promise((resolve, reject) => {
            const poll = setInterval(async () => {
              try {
                const sr = await fetch(`/api/status/${d.batchId}`);
                const sd = await sr.json();
                if (sd.status === 'completed') {
                  clearInterval(poll);
                  // crop-render stores result in jobs[0]
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
                  // in-progress: show per-clip sub-progress
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

      // Show in results section
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

  // Update pan slider display value
  function updatePanSliderLabel(pan) {
    if (Math.abs(pan) < 0.01) {
      randomPanVal.textContent = 'Center';
    } else if (pan < 0) {
      randomPanVal.textContent = `Left ${Math.abs(Math.round(pan * 100))}%`;
    } else {
      randomPanVal.textContent = `Right ${Math.round(pan * 100)}%`;
    }
  }

  // Calculate and apply translateX CSS transform to preview video for 9:16 frame panning preview
  function applyPreviewPan(pan) {
    if (!randomMediaInfo || !randomMediaInfo.height) return;
    const containerH = 240;
    const containerW = 135;
    const aspect = randomMediaInfo.width / randomMediaInfo.height;
    const videoW = containerH * aspect;
    const maxShift = (videoW - containerW) / 2;
    
    // Translation formula: -maxShift * (1 + pan)
    const tx = -maxShift * (1 + pan);
    randomPreviewPlayer.style.transform = `translateX(${tx}px)`;
  }

  // Wire up the slider input event listener
  if (randomPanSlider) {
    randomPanSlider.addEventListener('input', () => {
      const pan = parseFloat(randomPanSlider.value);
      updatePanSliderLabel(pan);
      
      // Save pan value on the active clip
      if (proposedClips[currentPreviewIndex]) {
        proposedClips[currentPreviewIndex].pan = pan;
      }
      
      // Update visual preview position
      applyPreviewPan(pan);
    });
  }

  // Wire fitMode change event to update preview player instantly
  const randomFitMode = $('randomFitMode');
  if (randomFitMode) {
    randomFitMode.addEventListener('change', () => {
      if (proposedClips.length > 0) {
        previewProposedClip(currentPreviewIndex);
      }
    });
  }

  // Helper to preview a proposed clip in the player
  function previewProposedClip(index) {
    currentPreviewIndex = index;
    updateRandomTimeline();
    const clip = proposedClips[index];
    if (!clip) return;

    // Highlight the active item visually
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
    
    // Normalize path helper for Windows systems
    const norm = p => p ? p.replace(/\\/g, '/').toLowerCase() : '';

    // Check if player already loaded this file path
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

    // Bind timeupdate loop logic once
    if (!randomPreviewPlayer._onTimeUpdateBound) {
      randomPreviewPlayer._onTimeUpdateBound = true;
      randomPreviewPlayer.addEventListener('timeupdate', () => {
        if (randomPreviewPlayer.seeking) return; // Skip updating currentTime while browser is seeking
        const activeClip = proposedClips[currentPreviewIndex];
        if (!activeClip) return;
        if (randomPreviewPlayer.currentTime >= activeClip.end || randomPreviewPlayer.currentTime < activeClip.start) {
          randomPreviewPlayer.currentTime = activeClip.start;
        }
      });
    }

    if (isSameVideo && randomPreviewPlayer.readyState >= 1) {
      // Stream matches and is loaded! Simply seek instantly without reloading.
      startPlay();
    } else {
      // Load source fresh and wait for metadata
      randomPreviewPlayer.src = targetSrc;
      randomPreviewPlayer.addEventListener('loadedmetadata', startPlay, { once: true });
      randomPreviewPlayer.load();
    }
  }

  // Helper to re-roll a specific proposed clip
  function rollClip(index) {
    const minGap = parseFloat($('randomMinGap').value) || 2;
    const maxStart = randomMediaInfo.duration - selectedDuration;
    let start;
    let attempts = 0;
    let valid = false;

    while (!valid && attempts < 200) {
      start = Math.random() * maxStart;
      valid = true;
      
      // Check gap against all other clips EXCEPT the one at our index to prevent overlaps/duplicates
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

  // Render the list of proposed clips
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

      // Event listeners for this row
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

  // Draw proposed clips on a visual 0-100% timeline track in Random Clips tab
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

  // Roll initial set of random clips (Step 02 main button click)
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

    // Generate random clip positions
    proposedClips = [];
    const maxStart = randomMediaInfo.duration - selectedDuration;
    
    for (let i = 0; i < clipCount; i++) {
      let start;
      let attempts = 0;
      let valid = false;
      
      // Try to find a valid position with minimum gap
      while (!valid && attempts < 150) {
        start = Math.random() * maxStart;
        valid = true;
        
        // Check minimum gap from existing clips to prevent overlaps/duplicates
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

    // Show proposed section, hide others
    randomProposedSection.classList.remove('hidden');
    randomProgressSection.classList.add('hidden');
    randomResultsSection.classList.add('hidden');
    randomEmptyState.classList.add('hidden');

    renderProposedList();
    previewProposedClip(0);
    toast(`Rolled ${proposedClips.length} clips for your review`);
  });

  // Start FFmpeg rendering for selected clips
  randomBtnStartRender.addEventListener('click', async () => {
    const selected = proposedClips.filter(c => c.checked);
    if (selected.length === 0) {
      toast('Please select at least one clip to generate', 'error');
      return;
    }

    const format = $('randomFormat').value;
    const fitMode = $('randomFitMode').value;
    const filePath = randomFilePath.value.trim();

    // Pause player preview before rendering
    randomPreviewPlayer.pause();

    // Show progress UI, hide proposed section
    randomProposedSection.classList.add('hidden');
    randomProgressSection.classList.remove('hidden');
    randomResultsSection.classList.add('hidden');
    randomProgressFill.style.width = '0%';
    randomStatusText.textContent = `Generating ${selected.length} clips...`;

    // Render one by one
    const results = [];
    const folderName = `${selectedDuration}s`;
    
    for (let i = 0; i < selected.length; i++) {
      const clip = selected[i];
      randomStatusText.textContent = `Generating clip ${i + 1}/${selected.length} (${clip.start.toFixed(1)}s)...`;
      randomProgressFill.style.width = `${((i + 1) / selected.length) * 100}%`;

      // Calculate 9:16 crop rectangle if fitMode is crop
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

    // Poll for completion
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

    // Show results
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
    loadLibrary(); // Reload list after generation
  });

  // Load and display generated clips in library list
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

  // Bind refresh click
  if (randomBtnRefreshLibrary) {
    randomBtnRefreshLibrary.addEventListener('click', loadLibrary);
  }

  // Load library on start
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

function initSubtitles() {
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

  let currentSrtPath = null;       // original transcribed SRT path
  let currentBurnSrtPath = null;   // SRT to burn (original or translated)

  // --- BROWSE ---
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

  // --- ANALYZE ---
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

  // --- STEP 1: TRANSCRIBE ---
  subBtnGenerate.addEventListener('click', async () => {
    const fp = subFilePath.value.trim();
    if (!fp) return;
    subBtnGenerate.disabled = true;
    subEmptyState.classList.add('hidden');
    subResultsSection.classList.add('hidden');
    subTranslateSection.classList.add('disabled-state');
    subBurnSection.classList.add('disabled-state');
    subProgressSection.classList.remove('hidden');
    subProgressFill.style.width = '0%';
    subStatusText.textContent = 'Extracting audio and initializing transcription...';
    try {
      const r = await fetch('/api/subtitle-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fp, langCode: subLanguageSelect.value })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Generation failed');

      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`/api/status/${d.batchId}`);
          const sd = await sr.json();
          if (sd.status === 'transcribing') {
            subProgressFill.style.width = `${sd.progress}%`;
            subStatusText.textContent = `Transcribing audio chunks: ${sd.progress}%`;
          } else if (sd.status === 'completed') {
            clearInterval(poll);
            subProgressSection.classList.add('hidden');
            currentSrtPath = sd.srtPath;
            currentBurnSrtPath = sd.srtPath; // default burn from original
            subBtnDownloadSrt.href = sd.srtPath;
            subResultLang.textContent = sd.detectedLanguage
              ? `Detected: ${sd.detectedLanguage}`
              : subLanguageSelect.options[subLanguageSelect.selectedIndex].text;
            // Load SRT preview
            try {
              const txt = await (await fetch(sd.srtPath)).text();
              subSrtPreviewText.value = txt;
            } catch {}
            subResultsSection.classList.remove('hidden');
            subTranslateSection.classList.remove('disabled-state');
            subBurnSection.classList.remove('disabled-state');
            toast('Subtitles generated!');
            subBtnGenerate.disabled = false;
          } else if (sd.status === 'failed') {
            clearInterval(poll);
            throw new Error(sd.error || 'Transcription failed');
          }
        } catch (err) {
          clearInterval(poll);
          subProgressSection.classList.add('hidden');
          subEmptyState.classList.remove('hidden');
          toast(err.message, 'error');
          subBtnGenerate.disabled = false;
        }
      }, 1000);
    } catch (e) {
      subProgressSection.classList.add('hidden');
      subEmptyState.classList.remove('hidden');
      toast(e.message, 'error');
      subBtnGenerate.disabled = false;
    }
  });

  // --- STEP 2: TRANSLATE ---
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
            currentBurnSrtPath = sd.translatedSrtPath; // update burn target to translated
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

  // --- STEP 3: BURN ---
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
}
