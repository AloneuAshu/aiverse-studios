import { $, toast } from './utils.js';

export function initTrimStudio() {
  const trimFilePath = $('trimFilePath');
  const trimBtnBrowse = $('trimBtnBrowse');
  const trimBtnLoad = $('trimBtnLoad');
  const trimVideoMeta = $('trimVideoMeta');
  const trimMetaFile = $('trimMetaFile');
  const trimMetaDur = $('trimMetaDur');
  const trimMetaRes = $('trimMetaRes');
  
  const trimFormatSelect = $('trimFormatSelect');
  const trimBtnExport = $('trimBtnExport');
  const trimBtnQuickExport = $('trimBtnQuickExport');
  const trimRenderStatus = $('trimRenderStatus');
  const trimProgressFill = $('trimProgressFill');
  const trimStatusText = $('trimStatusText');
  const trimResultCard = $('trimResultCard');
  const trimResultLink = $('trimResultLink');
  
  const trimPreviewPlayer = $('trimPreviewPlayer');
  const trimPlayerEmpty = $('trimPlayerEmpty');
  const trimCanvasInfo = $('trimCanvasInfo');
  
  const trimFilmstripSection = $('trimFilmstripSection');
  const trimFsRuler = $('trimFsRuler');
  const trimFsTrackOuter = $('trimFsTrackOuter');
  const trimFsFrames = $('trimFsFrames');
  const trimFsLoading = $('trimFsLoading');
  
  const trimFsMaskLeft = $('trimFsMaskLeft');
  const trimFsMaskRight = $('trimFsMaskRight');
  const trimFsSelection = $('trimFsSelection');
  const trimFsHandleLeft = $('trimFsHandleLeft');
  const trimFsHandleRight = $('trimFsHandleRight');
  const trimFsTooltipLeft = $('trimFsTooltipLeft');
  const trimFsTooltipRight = $('trimFsTooltipRight');
  const trimFsPlayhead = $('trimFsPlayhead');
  const trimFsPlayheadTime = $('trimFsPlayheadTime');
  
  const trimBtnPlayPause = $('trimBtnPlayPause');
  const trimTimeIn = $('trimTimeIn');
  const trimTimeOut = $('trimTimeOut');
  const trimDurationBadge = $('trimDurationBadge');
  const trimBtnSetIn = $('trimBtnSetIn');
  const trimBtnSetOut = $('trimBtnSetOut');
  
  let ts = {
    filePath: '',
    duration: 0,
    trimStart: 0,
    trimEnd: 0,
    loaded: false
  };

  let currentZoom = 1;
  const trimTimelineZoomWrapper = $('trimTimelineZoomWrapper');

  const fmtTime = t => {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s}`;
  };

  function updateTrimUI() {
    if (!ts.duration) return;
    const startPct = (ts.trimStart / ts.duration) * 100;
    const endPct = (ts.trimEnd / ts.duration) * 100;
    
    trimFsSelection.style.left = `${startPct}%`;
    trimFsSelection.style.width = `${endPct - startPct}%`;
    
    trimFsMaskLeft.style.width = `${startPct}%`;
    trimFsMaskRight.style.left = `${endPct}%`;
    trimFsMaskRight.style.width = `${100 - endPct}%`;
    
    trimFsTooltipLeft.textContent = fmtTime(ts.trimStart);
    trimFsTooltipRight.textContent = fmtTime(ts.trimEnd);
    
    trimTimeIn.value = fmtTime(ts.trimStart);
    trimTimeOut.value = fmtTime(ts.trimEnd);
    trimDurationBadge.textContent = `${(ts.trimEnd - ts.trimStart).toFixed(1)}s`;
    
    updateTrimPlayhead();
  }

  function updateTrimPlayhead() {
    if (!ts.duration) return;
    const pct = (trimPreviewPlayer.currentTime / ts.duration) * 100;
    trimFsPlayhead.style.left = `${pct}%`;
    trimFsPlayheadTime.textContent = fmtTime(trimPreviewPlayer.currentTime);
  }

  trimPreviewPlayer.addEventListener('timeupdate', () => {
    updateTrimPlayhead();
    if (trimPreviewPlayer.currentTime > ts.trimEnd && !trimPreviewPlayer.paused) {
      trimPreviewPlayer.currentTime = ts.trimStart;
    }
  });

  trimBtnBrowse.addEventListener('click', async () => {
    trimBtnBrowse.textContent = '...';
    trimBtnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Browse failed');
      if (d.filePath) {
        trimFilePath.value = d.filePath;
        toast('File selected');
      }
    } catch (e) {
      toast(e.message || 'Failed to open file browser', 'error');
    }
    trimBtnBrowse.textContent = 'BROWSE';
    trimBtnBrowse.disabled = false;
  });

  trimBtnLoad.addEventListener('click', async () => {
    const filePath = trimFilePath.value.trim();
    if (!filePath) { toast('Please specify file path', 'error'); return; }
    
    trimBtnLoad.disabled = true;
    trimBtnLoad.textContent = '⏳ ANALYZING...';
    
    try {
      const r = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Probe failed');
      
      ts.filePath = filePath;
      ts.duration = d.duration;
      ts.trimStart = 0;
      ts.trimEnd = d.duration;
      ts.loaded = true;
      
      trimMetaFile.textContent = d.fileName;
      trimMetaDur.textContent = `${d.duration.toFixed(1)}s`;
      trimMetaRes.textContent = `${d.width}x${d.height} (${d.fps} FPS)`;
      
      trimVideoMeta.classList.remove('hidden');
      
      trimPreviewPlayer.src = `/api/video-stream?filePath=${encodeURIComponent(filePath)}`;
      trimPreviewPlayer.style.display = 'block';
      trimPreviewPlayer.load();
      trimPlayerEmpty.style.display = 'none';
      trimCanvasInfo.textContent = `File loaded. Original resolution: ${d.width}x${d.height}`;
      
      trimFilmstripSection.style.display = 'flex';
      buildTrimFilmstrip(filePath, d.duration);
      
      trimBtnExport.disabled = false;
      if (trimBtnQuickExport) trimBtnQuickExport.disabled = false;
      toast('Video loaded successfully!');
    } catch (e) {
      toast(e.message || 'Failed to analyze video', 'error');
    }
    trimBtnLoad.disabled = false;
    trimBtnLoad.textContent = '▶ LOAD VIDEO';
  });

  function buildTrimFilmstrip(filePath, duration) {
    const scrollContainer = document.querySelector('.trim-timeline-scroll-container');
    const baseW = scrollContainer ? (scrollContainer.clientWidth || 800) : 800;
    const trackW = baseW * currentZoom;
    const thumbW = 75;
    const numFrames = Math.max(8, Math.floor(trackW / thumbW));
    
    if (trimTimelineZoomWrapper) {
      trimTimelineZoomWrapper.style.width = `${trackW}px`;
    }
    
    trimFsFrames.querySelectorAll('.fs-frame-img').forEach(el => el.remove());
    trimFsLoading.style.display = 'flex';
    
    trimFsRuler.innerHTML = '';
    const numTicks = 10 * currentZoom;
    for (let i = 0; i <= numTicks; i++) {
      const tick = document.createElement('div');
      tick.className = 'fs-ruler-tick';
      tick.style.left = `${(i / numTicks) * 100}%`;
      const tickTime = (i / numTicks) * duration;
      tick.innerHTML = `<span>${fmtTime(tickTime)}</span>`;
      trimFsRuler.appendChild(tick);
    }
    
    let loadedCount = 0;
    for (let i = 0; i < numFrames; i++) {
      const t = (i / (numFrames - 1)) * duration;
      const img = document.createElement('img');
      img.className = 'fs-frame-img';
      img.style.width = `${100 / numFrames}%`;
      img.style.background = '#0a0c12';
      img.src = `/api/thumbnail-at?filePath=${encodeURIComponent(filePath)}&time=${t.toFixed(2)}`;
      
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= numFrames) {
          trimFsLoading.style.display = 'none';
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= numFrames) {
          trimFsLoading.style.display = 'none';
        }
      };
      
      trimFsFrames.insertBefore(img, trimFsLoading);
    }
    
    updateTrimUI();
  }

  let dragInfo = null;

  trimFsHandleLeft.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    trimFsHandleLeft.classList.add('dragging');
    const rect = trimFsTrackOuter.getBoundingClientRect();
    dragInfo = { type: 'left', startX: e.clientX, rect, startTrimStart: ts.trimStart, startTrimEnd: ts.trimEnd };
  });

  trimFsHandleRight.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    trimFsHandleRight.classList.add('dragging');
    const rect = trimFsTrackOuter.getBoundingClientRect();
    dragInfo = { type: 'right', startX: e.clientX, rect, startTrimStart: ts.trimStart, startTrimEnd: ts.trimEnd };
  });

  trimFsSelection.addEventListener('mousedown', e => {
    if (e.target.closest('.fs-handle')) return;
    e.stopPropagation(); e.preventDefault();
    const rect = trimFsTrackOuter.getBoundingClientRect();
    dragInfo = { type: 'box', startX: e.clientX, rect, startTrimStart: ts.trimStart, startTrimEnd: ts.trimEnd };
    trimFsSelection.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!dragInfo || !ts.loaded || !ts.duration) return;
    const dx = e.clientX - dragInfo.startX;
    const dTime = (dx / dragInfo.rect.width) * ts.duration;
    const minGap = 0.2;
    
    if (dragInfo.type === 'left') {
      const newStart = Math.max(0, Math.min(dragInfo.startTrimEnd - minGap, dragInfo.startTrimStart + dTime));
      ts.trimStart = parseFloat(newStart.toFixed(2));
      trimPreviewPlayer.currentTime = ts.trimStart;
    } else if (dragInfo.type === 'right') {
      const newEnd = Math.min(ts.duration, Math.max(dragInfo.startTrimStart + minGap, dragInfo.startTrimEnd + dTime));
      ts.trimEnd = parseFloat(newEnd.toFixed(2));
      trimPreviewPlayer.currentTime = ts.trimEnd;
    } else if (dragInfo.type === 'box') {
      const len = dragInfo.startTrimEnd - dragInfo.startTrimStart;
      const ns = Math.max(0, Math.min(ts.duration - len, dragInfo.startTrimStart + dTime));
      ts.trimStart = parseFloat(ns.toFixed(2));
      ts.trimEnd = parseFloat((ns + len).toFixed(2));
      trimPreviewPlayer.currentTime = ts.trimStart;
    }
    updateTrimUI();
  });

  window.addEventListener('mouseup', () => {
    if (dragInfo) {
      trimFsHandleLeft.classList.remove('dragging');
      trimFsHandleRight.classList.remove('dragging');
      trimFsSelection.style.cursor = '';
      if (dragInfo.type === 'right') {
        trimPreviewPlayer.currentTime = ts.trimEnd;
      } else {
        trimPreviewPlayer.currentTime = ts.trimStart;
      }
      dragInfo = null;
    }
  });

  let scrubActive = false;
  trimFsRuler.addEventListener('mousedown', e => {
    if (!ts.loaded || !ts.duration) return;
    scrubActive = true;
    scrubTo(e);
  });
  window.addEventListener('mousemove', e => {
    if (scrubActive) scrubTo(e);
  });
  window.addEventListener('mouseup', () => {
    scrubActive = false;
  });

  function scrubTo(e) {
    const rect = trimFsTrackOuter.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const t = Math.max(0, Math.min(ts.duration, pos * ts.duration));
    trimPreviewPlayer.currentTime = t;
    updateTrimPlayhead();
  }

  trimBtnPlayPause.addEventListener('click', () => {
    if (trimPreviewPlayer.paused) {
      if (trimPreviewPlayer.currentTime >= ts.trimEnd || trimPreviewPlayer.currentTime < ts.trimStart) {
        trimPreviewPlayer.currentTime = ts.trimStart;
      }
      trimPreviewPlayer.play();
      trimBtnPlayPause.textContent = '⏸ Pause';
    } else {
      trimPreviewPlayer.pause();
      trimBtnPlayPause.textContent = '▶ Play';
    }
  });

  trimBtnSetIn.addEventListener('click', () => {
    if (!ts.loaded) return;
    const t = trimPreviewPlayer.currentTime;
    if (t < ts.trimEnd) {
      ts.trimStart = parseFloat(t.toFixed(2));
      updateTrimUI();
    } else {
      toast('In point cannot be after Out point', 'error');
    }
  });

  trimBtnSetOut.addEventListener('click', () => {
    if (!ts.loaded) return;
    const t = trimPreviewPlayer.currentTime;
    if (t > ts.trimStart) {
      ts.trimEnd = parseFloat(t.toFixed(2));
      updateTrimUI();
    } else {
      toast('Out point cannot be before In point', 'error');
    }
  });

  const parseDisplayTime = val => {
    const parts = val.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(val);
  };

  trimTimeIn.addEventListener('change', () => {
    if (!ts.loaded) return;
    const t = parseDisplayTime(trimTimeIn.value);
    if (!isNaN(t) && t >= 0 && t < ts.trimEnd) {
      ts.trimStart = parseFloat(t.toFixed(2));
      trimPreviewPlayer.currentTime = ts.trimStart;
    }
    updateTrimUI();
  });

  trimTimeOut.addEventListener('change', () => {
    if (!ts.loaded) return;
    const t = parseDisplayTime(trimTimeOut.value);
    if (!isNaN(t) && t > ts.trimStart && t <= ts.duration) {
      ts.trimEnd = parseFloat(t.toFixed(2));
      trimPreviewPlayer.currentTime = ts.trimEnd;
    }
    updateTrimUI();
  });

  const startExport = async () => {
    if (!ts.loaded) return;
    trimBtnExport.disabled = true;
    if (trimBtnQuickExport) trimBtnQuickExport.disabled = true;
    trimResultCard.classList.add('hidden');
    trimRenderStatus.classList.remove('hidden');
    trimProgressFill.style.width = '0%';
    trimStatusText.textContent = 'Queuing trim job...';
    
    const startSec = ts.trimStart;
    const duration = ts.trimEnd - ts.trimStart;
    const format = trimFormatSelect.value;
    
    try {
      const r = await fetch('/api/trim-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: ts.filePath,
          startSec,
          duration,
          format
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to submit trim job');
      
      // Automatically advance markers for consecutive trimming:
      // Set the next In time to the current Out time, and next Out time to the video end.
      ts.trimStart = ts.trimEnd;
      ts.trimEnd = ts.duration;
      updateTrimUI();
      
      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`/api/status/${d.batchId}`);
          const sd = await sr.json();
          const job = sd.jobs ? sd.jobs[0] : null;
          
          if (sd.status === 'completed' && job && job.status === 'completed') {
            clearInterval(poll);
            trimProgressFill.style.width = '100%';
            trimRenderStatus.classList.add('hidden');
            
            trimResultLink.href = job.outputPath;
            trimResultLink.download = job.outputFileName;
            trimResultCard.classList.remove('hidden');
            trimBtnExport.disabled = false;
            if (trimBtnQuickExport) trimBtnQuickExport.disabled = false;
            toast('Video trimmed and exported successfully! ✂️');
          } else if (sd.status === 'failed' || (job && job.status === 'failed')) {
            clearInterval(poll);
            throw new Error((job && job.error) || sd.error || 'Trim failed');
          } else {
            const progress = job ? job.progress : 10;
            trimProgressFill.style.width = `${progress}%`;
            trimStatusText.textContent = (job ? job.status : '') || 'Trimming...';
          }
        } catch (err) {
          clearInterval(poll);
          trimRenderStatus.classList.add('hidden');
          trimBtnExport.disabled = false;
          if (trimBtnQuickExport) trimBtnQuickExport.disabled = false;
          toast(err.message, 'error');
        }
      }, 1000);
    } catch (e) {
      trimRenderStatus.classList.add('hidden');
      trimBtnExport.disabled = false;
      if (trimBtnQuickExport) trimBtnQuickExport.disabled = false;
      toast(e.message, 'error');
    }
  };

  trimBtnExport.addEventListener('click', startExport);
  if (trimBtnQuickExport) trimBtnQuickExport.addEventListener('click', startExport);

  const trimBtnFullscreen = $('trimBtnFullscreen');
  if (trimBtnFullscreen) {
    trimBtnFullscreen.addEventListener('click', () => {
      document.body.classList.toggle('trim-fullscreen-active');
      const isFull = document.body.classList.contains('trim-fullscreen-active');
      trimBtnFullscreen.textContent = isFull ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
      trimBtnFullscreen.style.background = isFull ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6,182,212,0.15)';
      trimBtnFullscreen.style.color = isFull ? '#ef4444' : 'var(--accent-cyan)';
    });
  }

  const setupZoomBtn = (btnId, zoomVal) => {
    const btn = $(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!ts.loaded) return;
      document.querySelectorAll('.fs-duration-presets .fs-preset-btn').forEach(b => {
        if (b.id.startsWith('trimZoom')) b.classList.remove('active');
      });
      btn.classList.add('active');
      
      currentZoom = zoomVal;
      trimTimelineZoomWrapper.style.width = `${currentZoom * 100}%`;
      
      buildTrimFilmstrip(ts.filePath, ts.duration);
    });
  };

  setupZoomBtn('trimZoom1', 1);
  setupZoomBtn('trimZoom5', 5);
  setupZoomBtn('trimZoom20', 20);
  setupZoomBtn('trimZoom50', 50);

  window.addEventListener('keydown', e => {
    const tab = document.querySelector('.sidebar-tab.active');
    if (!tab || tab.dataset.tab !== 'trimStudio') return;
    if (document.activeElement.tagName === 'INPUT') return;
    
    if (e.code === 'Space') {
      e.preventDefault();
      trimBtnPlayPause.click();
    } else if (e.code === 'KeyI') {
      e.preventDefault();
      trimBtnSetIn.click();
    } else if (e.code === 'KeyO') {
      e.preventDefault();
      trimBtnSetOut.click();
    }
  });
}
