import { $, toast, fmtSec } from './utils.js';

export function initCropStudio() {
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

  if (!cropCanvas || !cropCtx || !cropPreviewCanvas || !cropPreviewCtx) {
    console.error('[Crop Studio] Critical canvas elements missing');
    return;
  }

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
    cropBtnLoad.textContent = 'LOADING…';
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
      cropMetaRes.textContent  = `${d.width}×${d.height}`;
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
      cropCanvasInfo.textContent = `${d.width}×${d.height} · ${fmtSec(d.duration)} · ready`;

      vid.addEventListener('loadedmetadata', function onMetadataLoaded() {
        vid.removeEventListener('loadedmetadata', onMetadataLoaded);
        vid.currentTime = 0;
        
        vid.addEventListener('seeked', function onFirstSeek() {
          vid.removeEventListener('seeked', onFirstSeek);
          scheduleFrame();
          toast('Video fully loaded - ready for trimming');
        });
      });

      vid.onerror = function() {
        console.error('[Crop Studio] Video load error');
        toast('Failed to load video stream', 'error');
        cs.loaded = false;
      };

      filmstripSection.style.display = 'flex';
      fsExportBtn.disabled = false;
      buildFilmstrip();
      toast(`Loaded: ${d.fileName}`);
    } catch (e) {
      toast(e.message || 'Failed to load video', 'error');
    } finally {
      cropBtnLoad.textContent = '▶ LOAD VIDEO';
      cropBtnLoad.disabled = false;
    }
  }

  const THUMB_W = 90, THUMB_H = 68;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = THUMB_W; thumbCanvas.height = THUMB_H;
  const thumbCtx = thumbCanvas.getContext('2d');
  const filmstripCache = new Map();
  
  function getCacheKey(filePath, time) {
    return `${filePath}_${time.toFixed(2)}`;
  }
  
  function once(fn) {
    let called = false;
    return function(...args) {
      if (!called) {
        called = true;
        fn.apply(this, args);
      }
    };
  }

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

  async function buildFilmstrip() {
    const trackOuter = document.getElementById('fsTrackOuter');
    if (!trackOuter) return;
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
      
      if (filmstripCache.has(cacheKey)) {
        img.src = filmstripCache.get(cacheKey);
        fsFrames.insertBefore(img, fsLoading);
        promises.push(Promise.resolve());
        continue;
      }
      
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
          resolve();
        });
      });
      promises.push(p);
      fsFrames.insertBefore(img, fsLoading);
    }

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

  function updateFilmstripPlayhead() {
    if (!cs.duration) return;
    const pct = (vid.currentTime / cs.duration) * 100;
    fsPlayhead.style.left = `${pct}%`;
    const m = Math.floor(vid.currentTime / 60).toString().padStart(2,'0');
    const s = (vid.currentTime % 60).toFixed(2).padStart(5,'0');
    fsPlayheadTime.textContent = `${m}:${s}`;
  }

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
    
    const playheadPct = pct * 100;
    fsPlayhead.style.left = `${playheadPct}%`;
    const m = Math.floor(targetTime / 60).toString().padStart(2,'0');
    const s = (targetTime % 60).toFixed(2).padStart(5,'0');
    fsPlayheadTime.textContent = `${m}:${s}`;

    if (!vid.seeking) {
      vid.currentTime = targetTime;
    }
  }

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
    const MIN   = 0.1;
    const SNAP_THRESHOLDS = [5, 15, 20, 30, 60];
    const SNAP_TOLERANCE = 0.5;

    if (fsDrag.type === 'left') {
      let newStart = Math.max(0, Math.min(fsDrag.startTrimEnd - MIN, fsDrag.startTrimStart + dTime));
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
      vid.currentTime = cs.trimStart;
    } else if (fsDrag.type === 'right') {
      let newEnd = Math.min(cs.duration, Math.max(fsDrag.startTrimStart + MIN, fsDrag.startTrimEnd + dTime));
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
      vid.currentTime = cs.trimEnd;
    } else if (fsDrag.type === 'box') {
      const len = fsDrag.startTrimEnd - fsDrag.startTrimStart;
      let ns = Math.max(0, Math.min(cs.duration - len, fsDrag.startTrimStart + dTime));
      if (e.shiftKey) {
        const currentDuration = len;
        for (const target of SNAP_THRESHOLDS) {
          if (Math.abs(currentDuration - target) < SNAP_TOLERANCE) {
            const newLen = target;
            ns = Math.max(0, Math.min(cs.duration - newLen, ns));
            break;
          }
        }
      }
      cs.trimStart = parseFloat(ns.toFixed(3));
      cs.trimEnd   = parseFloat((ns + len).toFixed(3));
      vid.currentTime = cs.trimStart;
    }
    updateFilmstripUI();
  });

  window.addEventListener('mouseup', () => {
    if (fsDrag) {
      fsHandleLeft.classList.remove('dragging');
      fsHandleRight.classList.remove('dragging');
      fsSelection.style.cursor = '';
      if (fsDrag.type === 'right') {
        vid.currentTime = cs.trimEnd;
      } else {
        vid.currentTime = cs.trimStart;
      }
      fsDrag = null;
      scheduleFrame();
    }
  });

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
      
      if (hoverPreviewTimeout) clearTimeout(hoverPreviewTimeout);
      hoverPreviewTimeout = setTimeout(() => {
        if (lastHoverTime === null || Math.abs(time - lastHoverTime) > 0.1) {
          lastHoverTime = time;
          const cacheKey = getCacheKey(cs.filePath, time);
          if (filmstripCache.has(cacheKey)) {
            fsHoverPreviewImg.src = filmstripCache.get(cacheKey);
          } else {
            fsHoverPreviewImg.src = `/api/thumbnail-at?filePath=${encodeURIComponent(cs.filePath)}&time=${time.toFixed(2)}`;
          }
          const m = Math.floor(time / 60).toString().padStart(2,'0');
          const s = (time % 60).toFixed(2).padStart(5,'0');
          fsHoverTime.textContent = `${m}:${s}`;
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

  function parseTime(val) {
    if (!val) return NaN;
    val = val.trim();
    if (val.includes(':')) {
      const parts = val.split(':');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const sec = parseFloat(parts[1]);
        if (!isNaN(min) && !isNaN(sec)) return min * 60 + sec;
      }
      if (parts.length === 3) {
        const hr = parseFloat(parts[0]);
        const min = parseFloat(parts[1]);
        const sec = parseFloat(parts[2]);
        if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) return hr * 3600 + min * 60 + sec;
      }
    }
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
      updateFilmstripUI();
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
      updateFilmstripUI();
      toast('Invalid end time (must be at least 0.1s after start)', 'error');
    }
  });

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

  cropXSlider.addEventListener('input', () => { cs.panX = parseFloat(cropXSlider.value); cropXVal.textContent = cs.panX === 0 ? 'Center' : `${(cs.panX*100).toFixed(0)}%`; scheduleFrame(); });
  cropYSlider.addEventListener('input', () => { cs.panY = parseFloat(cropYSlider.value); cropYVal.textContent = cs.panY === 0 ? 'Center' : `${(cs.panY*100).toFixed(0)}%`; scheduleFrame(); });
  cropZoomSlider.addEventListener('input', () => { cs.zoom = parseFloat(cropZoomSlider.value); cropZoomVal.textContent = `${cs.zoom.toFixed(2)}×`; scheduleFrame(); });

  cropBtnPlayPause.addEventListener('click', () => {
    if (!cs.loaded) return;
    if (cs.playing) {
      vid.pause(); cs.playing = false; cropBtnPlayPause.textContent = '▶ Play';
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      if (vid.currentTime < cs.trimStart || vid.currentTime >= cs.trimEnd) vid.currentTime = cs.trimStart;
      vid.play(); cs.playing = true; cropBtnPlayPause.textContent = '⏸ Pause';
      rafId = requestAnimationFrame(drawFrame);
    }
  });

  vid.addEventListener('ended', () => {
    cs.playing = false; cropBtnPlayPause.textContent = '▶ Play';
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    scheduleFrame();
  });

  fsKeepBtn.addEventListener('click', () => {
    if (!cs.loaded) return;
    const fmt = t => {
      const m = Math.floor(t/60).toString().padStart(2,'0');
      const s = (t%60).toFixed(1).padStart(4,'0');
      return `${m}:${s}`;
    };
    toast(`✂ Kept: ${fmt(cs.trimStart)} → ${fmt(cs.trimEnd)} (${(cs.trimEnd-cs.trimStart).toFixed(1)}s)`);
    fsSelection.style.outline = '2px solid #22c55e';
    setTimeout(() => { fsSelection.style.outline = ''; }, 800);
  });

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
    toast('✕ Segment skipped — selection advanced');
  });

  const presetBtns = document.querySelectorAll('.fs-preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!cs.loaded) return;
      const duration = parseFloat(btn.dataset.duration);
      setDurationFromStart(duration);
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

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
      presetBtns.forEach(b => b.classList.remove('active'));
      toast(`Custom duration set: ${duration}s`);
    });

    fsCustomDuration.addEventListener('keydown', e => {
      if (e.key === 'Enter') fsSetCustomDuration.click();
    });
  }

  const fsSetFromCurrent = document.getElementById('fsSetFromCurrent');
  if (fsSetFromCurrent) {
    fsSetFromCurrent.addEventListener('click', () => {
      if (!cs.loaded) return;
      const currentDuration = cs.trimEnd - cs.trimStart;
      cs.trimStart = parseFloat(vid.currentTime.toFixed(3));
      cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + currentDuration).toFixed(3));
      if (cs.trimEnd - cs.trimStart < 0.1) {
        cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + 0.1).toFixed(3));
      }
      vid.currentTime = cs.trimStart;
      updateFilmstripUI();
      scheduleFrame();
      toast(`Duration moved to: ${cs.trimStart.toFixed(2)}s`);
    });
  }

  function setDurationFromStart(duration) {
    cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + duration).toFixed(3));
    if (cs.trimEnd >= cs.duration) {
      cs.trimStart = parseFloat(Math.max(0, cs.duration - duration).toFixed(3));
      cs.trimEnd = cs.duration;
    }
    vid.currentTime = cs.trimStart;
    updateFilmstripUI();
    scheduleFrame();
    toast(`Duration set: ${duration}s`);
  }

  const trimBtns = document.querySelectorAll('.fs-trim-btn');
  trimBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!cs.loaded) {
        toast('Please load a video first', 'error');
        return;
      }
      const duration = parseFloat(btn.dataset.trimDuration);
      const folder = btn.dataset.folder;
      cs.trimEnd = parseFloat(Math.min(cs.duration, cs.trimStart + duration).toFixed(3));
      if (cs.trimEnd >= cs.duration) {
        cs.trimStart = parseFloat(Math.max(0, cs.duration - duration).toFixed(3));
        cs.trimEnd = cs.duration;
      }
      vid.currentTime = cs.trimStart;
      updateFilmstripUI();
      scheduleFrame();
      await exportToFolder(folder);
    });
  });

  async function exportToFolder(folder) {
    const startSec = cs.trimStart;
    const duration = cs.trimEnd - cs.trimStart;
    const cr  = getCropRect();
    const cropX = Math.round(cr.x / 2) * 2;
    const cropY = Math.round(cr.y / 2) * 2;
    const cropW = Math.round(cr.w / 2) * 2;
    const cropH = Math.round(cr.h / 2) * 2;

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

    trimBtns.forEach(b => b.disabled = true);
    fsExportBtn.disabled = true;
    cropRenderStatus.classList.remove('hidden');
    cropResultCard.classList.add('hidden');
    cropProgressFill.style.width = '0%';
    cropStatusText.textContent = `Trimming to ${folder} folder…`;

    try {
      const r = await fetch('/api/crop-render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filePath: cs.filePath, startSec, duration, cropX, cropY, cropW, cropH, 
          srcW: cs.srcW, srcH: cs.srcH, fitMode: cs.fitMode, format: fsFormatSelect.value, outputFolder: folder 
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

  const cropBtnReset = document.getElementById('cropBtnReset');
  if (cropBtnReset) {
    cropBtnReset.addEventListener('click', () => {
      cs.panX = 0; cs.panY = 0; cs.zoom = 1;
      cropXSlider.value = 0; cropYSlider.value = 0; cropZoomSlider.value = 1;
      cropXVal.textContent = 'Center'; cropYVal.textContent = 'Center'; cropZoomVal.textContent = '1.00×';
      if (cs.loaded) {
        cs.trimStart = 0; cs.trimEnd = Math.min(30, cs.duration);
        vid.currentTime = 0;
        updateFilmstripUI();
      }
      scheduleFrame();
    });
  }

  [cropFitBlur, cropFitCrop].forEach(btn => {
    btn.addEventListener('click', () => {
      [cropFitBlur, cropFitCrop].forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); cs.fitMode = btn.dataset.cropfit;
    });
  });

  cropBtnBrowse.addEventListener('click', async () => {
    cropBtnBrowse.textContent = '…'; cropBtnBrowse.disabled = true;
    try {
      const r = await fetch('/api/browse', { method: 'POST' });
      const d = await r.json();
      if (d.filePath) cropFilePathEl.value = d.filePath;
    } catch {}
    cropBtnBrowse.textContent = 'BROWSE'; cropBtnBrowse.disabled = false;
  });
  cropFilePathEl.addEventListener('keydown', e => { if (e.key === 'Enter') loadVideo(); });
  cropBtnLoad.addEventListener('click', loadVideo);

  fsExportBtn.addEventListener('click', async () => {
    if (!cs.loaded) return;
    const startSec = cs.trimStart;
    const duration = cs.trimEnd - cs.trimStart;
    const cr  = getCropRect();
    const cropX = Math.round(cr.x / 2) * 2;
    const cropY = Math.round(cr.y / 2) * 2;
    const cropW = Math.round(cr.w / 2) * 2;
    const cropH = Math.round(cr.h / 2) * 2;

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
    cropStatusText.textContent = 'Queuing render…';

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
          cropStatusText.textContent = typeof job.status === 'string' ? job.status : 'Rendering…';
          if (job.status === 'completed') {
            clearInterval(iv);
            cropProgressFill.style.width = '100%';
            cropStatusText.textContent = '✅ Done!';
            cropResultCard.classList.remove('hidden');
            cropResultLink.href = job.outputPath;
            cropResultLink.textContent = `▶ ${job.outputFileName}`;
            toast('Crop render complete!');
            resolve();
          } else if (job.status === 'failed') {
            clearInterval(iv); reject(new Error(job.error || 'Render failed'));
          }
        } catch (e) { clearInterval(iv); reject(e); }
      }, 700);
    });
  }

  window.cleanupCropStudio = function() {
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

  document.addEventListener('keydown', e => {
    if (!cs.loaded || document.activeElement.tagName === 'INPUT') return;
    const SHIFT_MOD = e.shiftKey ? 0.5 : 0.05;
    const ALT_MOD = e.altKey ? 0.001 : SHIFT_MOD;
    
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
