import { $, toast } from './utils.js';

// State management
let posterState = {
  aspect: '9:16',          // '9:16' (1080x1920), '16:9' (1920x1080), '1:1' (1080x1080)
  fitMode: 'blur',         // 'blur' (Blur Pad Fill), 'crop' (Smart 9:16 Crop), 'cover'
  panX: 0,                 // -1 (Left) to 1 (Right) horizontal pan offset
  sourceMode: 'ai',        // 'ai', 'video', 'upload'
  images: [],              // [{ id, dataUrl, title }]
  selectedIndex: 0,
  mainTitle: 'THE ETERNAL LEGEND',
  tagline: 'IN A WORLD BEYOND TIME, ONLY ONE WARRIOR CAN RESTORE THE LIGHT.',
  credits: 'A FILM BY AIVERSE STUDIOS • STARRING JOHN DOE',
  badge: 'EXCLUSIVE PREMIERE • 4K ULTRA HD',
  font: "'Cinzel Decorative', serif",
  colorPreset: 'gold',
  titleSize: 72,
  tracking: 6,
  verticalPos: 75,         // percentage from top (10 - 90%)
  vignette: 60,
  lut: 'teal-orange',
  letterbox: true,
  flare: true,
  grain: true
};

// Preset Surprises for "Surprise Me!" button
const SAMPLE_TITLES = [
  { title: "THE ETERNAL LEGEND", tagline: "IN A WORLD BEYOND TIME, ONLY ONE WARRIOR CAN RESTORE THE LIGHT.", credits: "DIRECTED BY CHRISTOPHER NOLAN • AIVERSE ORIGINALS" },
  { title: "CYBERNETIC RISING", tagline: "HUMANITY WAS JUST THE BEGINNING. THE MACHINES HAVE AWAKENED.", credits: "A FILM BY DENIS VILLENEUVE • FEATURING HANS ZIMMER SCORE" },
  { title: "SHADOW OF DESTINY", tagline: "SOME SECRETS ARE BURIED FOR A REASON.", credits: "AIVERSE STUDIOS PRESENTS • AN EPIC THRILLER" },
  { title: "NEBULA ODYSSEY", tagline: "BEYOND THE STARS LIES THE FINAL TRUTH.", credits: "STARRING MORGAN FREEMAN • PRODUCED BY LUCASFILM" },
  { title: "DARK KNIGHT REQUIEM", tagline: "JUSTICE HAS A NEW FACE IN THE DARKNESS.", credits: "WARNER BROS & AIVERSE STUDIOS • CINEMATIC EXPERIENCE" }
];

export function initPosterStudio() {
  console.log('[INIT] Poster Studio Module');
  
  setupAspectSelectors();
  setupFramingSelectors();
  setupSourceTabs();
  setupFormListeners();
  setupButtons();

  // Generate initial set of AI backdrop images
  generatePosterImages();
}

function setupAspectSelectors() {
  const aspectBtns = document.querySelectorAll('#posterAspectRow .fade-btn');
  aspectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      aspectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      posterState.aspect = btn.dataset.aspect;
      
      updateDimensionBadge();
      renderMasterPoster();
    });
  });
}

function setupFramingSelectors() {
  const framingBtns = document.querySelectorAll('#posterFramingRow .fade-btn');
  framingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      framingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      posterState.fitMode = btn.dataset.fit;
      renderMasterPoster();
    });
  });

  const sliderPan = $('posterPanSlider');
  if (sliderPan) {
    sliderPan.addEventListener('input', (e) => {
      posterState.panX = parseFloat(e.target.value);
      const val = $('posterPanVal');
      if (val) {
        if (posterState.panX === 0) val.textContent = 'Center';
        else if (posterState.panX < 0) val.textContent = `Left ${Math.abs(Math.round(posterState.panX * 100))}%`;
        else val.textContent = `Right ${Math.round(posterState.panX * 100)}%`;
      }
      renderMasterPoster();
    });
  }
}

function updateDimensionBadge() {
  const badge = $('posterDimBadge');
  if (!badge) return;
  if (posterState.aspect === '9:16') {
    badge.textContent = '1080 × 1920 (9:16 Vertical)';
  } else if (posterState.aspect === '16:9') {
    badge.textContent = '1920 × 1080 (16:9 Landscape)';
  } else {
    badge.textContent = '1080 × 1080 (1:1 Square)';
  }
}

function setupSourceTabs() {
  const tabs = document.querySelectorAll('.poster-source-tabs .source-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      posterState.sourceMode = tab.dataset.source;

      const videoGroup = $('posterVideoPathGroup');
      const uploadGroup = $('posterUploadGroup');

      if (videoGroup) videoGroup.classList.toggle('hidden', posterState.sourceMode !== 'video');
      if (uploadGroup) uploadGroup.classList.toggle('hidden', posterState.sourceMode !== 'upload');
    });
  });
}

function setupFormListeners() {
  // Inputs & Textareas
  const titleInput = $('posterMainTitle');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      posterState.mainTitle = e.target.value;
      renderMasterPoster();
    });
  }

  const taglineInput = $('posterTagline');
  if (taglineInput) {
    taglineInput.addEventListener('input', (e) => {
      posterState.tagline = e.target.value;
      renderMasterPoster();
    });
  }

  const creditsInput = $('posterCredits');
  if (creditsInput) {
    creditsInput.addEventListener('input', (e) => {
      posterState.credits = e.target.value;
      renderMasterPoster();
    });
  }

  const badgeInput = $('posterBadge');
  if (badgeInput) {
    badgeInput.addEventListener('input', (e) => {
      posterState.badge = e.target.value;
      renderMasterPoster();
    });
  }

  // Selects & Sliders
  const templatePreset = $('posterTemplatePreset');
  if (templatePreset) {
    templatePreset.addEventListener('change', (e) => {
      applyTemplatePreset(e.target.value);
    });
  }

  const fontSelect = $('posterFontSelect');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      posterState.font = e.target.value;
      renderMasterPoster();
    });
  }

  const colorPreset = $('posterColorPreset');
  if (colorPreset) {
    colorPreset.addEventListener('change', (e) => {
      posterState.colorPreset = e.target.value;
      renderMasterPoster();
    });
  }

  const lutSelect = $('posterLUTSelect');
  if (lutSelect) {
    lutSelect.addEventListener('change', (e) => {
      posterState.lut = e.target.value;
      renderMasterPoster();
    });
  }

  // Range Sliders
  const sliderSize = $('posterTitleSizeSlider');
  if (sliderSize) {
    sliderSize.addEventListener('input', (e) => {
      posterState.titleSize = parseInt(e.target.value, 10);
      const val = $('posterTitleSizeVal');
      if (val) val.textContent = `${posterState.titleSize}px`;
      renderMasterPoster();
    });
  }

  const sliderTracking = $('posterTrackingSlider');
  if (sliderTracking) {
    sliderTracking.addEventListener('input', (e) => {
      posterState.tracking = parseInt(e.target.value, 10);
      const val = $('posterTrackingVal');
      if (val) val.textContent = `${posterState.tracking}px`;
      renderMasterPoster();
    });
  }

  const sliderPos = $('posterPosSlider');
  if (sliderPos) {
    sliderPos.addEventListener('input', (e) => {
      posterState.verticalPos = parseInt(e.target.value, 10);
      const val = $('posterPosVal');
      if (val) val.textContent = `Position ${posterState.verticalPos}%`;
      renderMasterPoster();
    });
  }

  const sliderVignette = $('posterVignetteSlider');
  if (sliderVignette) {
    sliderVignette.addEventListener('input', (e) => {
      posterState.vignette = parseInt(e.target.value, 10);
      const val = $('posterVignetteVal');
      if (val) val.textContent = `${posterState.vignette}%`;
      renderMasterPoster();
    });
  }

  const sliderImgCount = $('posterImgCountSlider');
  if (sliderImgCount) {
    sliderImgCount.addEventListener('input', (e) => {
      const val = $('posterImgCountVal');
      if (val) val.textContent = `${e.target.value} Images`;
    });
  }

  // Toggles
  const checkLetterbox = $('posterCheckLetterbox');
  if (checkLetterbox) {
    checkLetterbox.addEventListener('change', (e) => {
      posterState.letterbox = e.target.checked;
      renderMasterPoster();
    });
  }

  const checkFlare = $('posterCheckFlare');
  if (checkFlare) {
    checkFlare.addEventListener('change', (e) => {
      posterState.flare = e.target.checked;
      renderMasterPoster();
    });
  }

  const checkGrain = $('posterCheckGrain');
  if (checkGrain) {
    checkGrain.addEventListener('change', (e) => {
      posterState.grain = e.target.checked;
      renderMasterPoster();
    });
  }

  // Custom File Upload
  const fileInput = $('posterFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const customImg = {
          id: `custom_${Date.now()}`,
          dataUrl: evt.target.result,
          title: file.name
        };
        posterState.images.unshift(customImg);
        posterState.selectedIndex = 0;
        renderGalleryGrid();
        renderMasterPoster();
        toast('Custom poster background uploaded!');
      };
      reader.readAsDataURL(file);
    });
  }
}

function setupButtons() {
  // Generate Images Button
  const btnGenerate = $('posterBtnGenerate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      generatePosterImages();
    });
  }

  // Surprise Me Button
  const btnSurprise = $('posterBtnSurprise');
  if (btnSurprise) {
    btnSurprise.addEventListener('click', () => {
      triggerSurpriseMe();
    });
  }

  // Download Button
  const btnDownload = $('posterBtnDownload');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      downloadPoster();
    });
  }

  // Save to Server Button
  const btnSave = $('posterBtnSaveServer');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      savePosterToServer();
    });
  }

  // Copy to Clipboard Button
  const btnCopy = $('posterBtnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      copyPosterToClipboard();
    });
  }

  // Video Path Browse Button
  const btnBrowseVideo = $('posterBtnBrowseVideo');
  if (btnBrowseVideo) {
    btnBrowseVideo.addEventListener('click', async () => {
      btnBrowseVideo.textContent = '…';
      btnBrowseVideo.disabled = true;
      try {
        const res = await fetch('/api/browse', { method: 'POST' });
        const data = await res.json();
        if (data.filePath) {
          const input = $('posterVideoPath');
          if (input) input.value = data.filePath;
          toast('Video path loaded!');
        }
      } catch (err) {
        toast(err.message || 'Browse failed or cancelled', 'error');
      } finally {
        btnBrowseVideo.textContent = 'BROWSE';
        btnBrowseVideo.disabled = false;
      }
    });
  }
}

function triggerSurpriseMe() {
  const randomPick = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
  posterState.mainTitle = randomPick.title;
  posterState.tagline = randomPick.tagline;
  posterState.credits = randomPick.credits;

  const fontOptions = document.querySelectorAll('#posterFontSelect option');
  const randomFont = fontOptions[Math.floor(Math.random() * fontOptions.length)].value;
  posterState.font = randomFont;

  const colorOptions = ['gold', 'cyan', 'crimson', 'silver', 'fire', 'emerald', 'white'];
  posterState.colorPreset = colorOptions[Math.floor(Math.random() * colorOptions.length)];

  // Pick random image from gallery if available
  if (posterState.images.length > 0) {
    posterState.selectedIndex = Math.floor(Math.random() * posterState.images.length);
  }

  // Sync inputs
  if ($('posterMainTitle')) $('posterMainTitle').value = posterState.mainTitle;
  if ($('posterTagline')) $('posterTagline').value = posterState.tagline;
  if ($('posterCredits')) $('posterCredits').value = posterState.credits;
  if ($('posterFontSelect')) $('posterFontSelect').value = posterState.font;
  if ($('posterColorPreset')) $('posterColorPreset').value = posterState.colorPreset;

  renderGalleryGrid();
  renderMasterPoster();
  toast('🎲 Surprise Me! Cinematic poster randomized.');
}

function applyTemplatePreset(presetKey) {
  if (presetKey === 'custom') return;

  if (presetKey === 'sankranthi') {
    posterState.mainTitle = 'సంక్రాంతికి వస్తున్నాం';
    posterState.tagline = 'MASS CELEBRATION IN THEATERS THIS SANKRANTHI!';
    posterState.credits = 'A FILM BY ANIL RAVIPUDI • MUSIC BY DEVI SRI PRASAD';
    posterState.badge = 'WORLDWIDE GRAND RELEASE JAN 14 SANKRANTHI';
    posterState.font = "'Ramabhadra', sans-serif";
    posterState.colorPreset = 'yellow-red';
    posterState.lut = 'golden';
    posterState.vignette = 40;
    posterState.flare = true;
    posterState.letterbox = true;
  } else if (presetKey === 'waltair') {
    posterState.mainTitle = 'వాల్తేరు వీరయ్య';
    posterState.tagline = 'POONAKAALU LOADING • MASS BLOCKBUSTER!';
    posterState.credits = 'MEGASTAR CHIRANJEEVI & MASS MAHARAJA RAVI TEJA';
    posterState.badge = 'MASS BLOCKBUSTER IN THEATERS NOW';
    posterState.font = "'Ramabhadra', sans-serif";
    posterState.colorPreset = 'fire';
    posterState.lut = 'teal-orange';
    posterState.vignette = 60;
    posterState.flare = true;
    posterState.letterbox = true;
  } else if (presetKey === 'gattakusthi') {
    posterState.mainTitle = 'మట్టి కుస్తీ';
    posterState.tagline = 'A HIGH ENERGY COMMERCIAL FAMILY ENTERTAINER';
    posterState.credits = 'PRODUCED BY VISHNU VISHAL • MUSIC BY JUSTIN PRABHAKARAN';
    posterState.badge = 'FEBRUARY 2 IN THEATERS';
    posterState.font = "'Suranna', serif";
    posterState.colorPreset = 'gold';
    posterState.lut = 'golden';
    posterState.vignette = 30;
    posterState.flare = false;
    posterState.letterbox = true;
  } else if (presetKey === 'panindia') {
    posterState.mainTitle = 'WORLDWIDE DEC 2 RELEASE';
    posterState.tagline = 'EXPERIENCE THE HIGH-VOLTAGE CINEMATIC SENSATION';
    posterState.credits = 'STARRING RAM CHARAN • DIRECTED BY BOYAPATI SREENU';
    posterState.badge = 'RELEASED WORLDWIDE IN 5 LANGUAGES';
    posterState.font = "'Bebas Neue', sans-serif";
    posterState.colorPreset = 'silver';
    posterState.lut = 'noir';
    posterState.vignette = 75;
    posterState.flare = true;
    posterState.letterbox = true;
  } else if (presetKey === 'period') {
    posterState.mainTitle = 'EPIC RAMAYANA LEGEND';
    posterState.tagline = 'THE SACRED TALE OF COURAGE, VALOR & DESTINY';
    posterState.credits = 'AIVERSE STUDIOS CINEMATIC EXPERIENCE';
    posterState.badge = 'GRAND CINEMATIC EXPERIENCE 2026';
    posterState.font = "'Cinzel Decorative', serif";
    posterState.colorPreset = 'gold';
    posterState.lut = 'golden';
    posterState.vignette = 50;
    posterState.flare = true;
    posterState.letterbox = true;
  }

  // Sync UI controls
  if ($('posterMainTitle')) $('posterMainTitle').value = posterState.mainTitle;
  if ($('posterTagline')) $('posterTagline').value = posterState.tagline;
  if ($('posterCredits')) $('posterCredits').value = posterState.credits;
  if ($('posterBadge')) $('posterBadge').value = posterState.badge;
  if ($('posterFontSelect')) $('posterFontSelect').value = posterState.font;
  if ($('posterColorPreset')) $('posterColorPreset').value = posterState.colorPreset;
  if ($('posterLUTSelect')) $('posterLUTSelect').value = posterState.lut;
  if ($('posterVignetteSlider')) $('posterVignetteSlider').value = posterState.vignette;
  if ($('posterVignetteVal')) $('posterVignetteVal').textContent = `${posterState.vignette}%`;
  if ($('posterCheckFlare')) $('posterCheckFlare').checked = posterState.flare;
  if ($('posterCheckLetterbox')) $('posterCheckLetterbox').checked = posterState.letterbox;

  renderMasterPoster();
  toast(`Applied Telugu Template: ${presetKey.toUpperCase()}`);
}

async function generatePosterImages() {
  const countSlider = $('posterImgCountSlider');
  const count = countSlider ? parseInt(countSlider.value, 10) : 6;
  const grid = $('posterGalleryGrid');
  if (grid) grid.innerHTML = '<div class="poster-gallery-loading">Generating poster backgrounds…</div>';

  posterState.images = [];

  if (posterState.sourceMode === 'video') {
    const vPath = $('posterVideoPath') ? $('posterVideoPath').value.trim() : '';
    if (!vPath) {
      toast('Please specify or browse a Video Source Path', 'error');
      // Fallback to AI backdrops
      generateAIBackdrops(count);
      return;
    }
    await extractVideoFrames(vPath, count);
  } else {
    generateAIBackdrops(count);
  }
}

function generateAIBackdrops(count) {
  const themes = [
    { name: 'Sci-Fi Cyberpunk', type: 'cyberpunk' },
    { name: 'Dark Knight Vignette', type: 'dark_knight' },
    { name: 'Mythic Inferno', type: 'fire_ice' },
    { name: 'Golden Hour Flare', type: 'sunset' },
    { name: 'Gothic Thriller', type: 'gothic' },
    { name: 'Abyssal Trench', type: 'ocean' },
    { name: 'Emerald Matrix', type: 'matrix' },
    { name: 'Royal Purple Gold', type: 'royal' }
  ];

  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length];
    const dataUrl = drawProceduralBackdrop(theme.type, i);
    posterState.images.push({
      id: `ai_${i}_${Date.now()}`,
      dataUrl,
      title: `${theme.name} #${i + 1}`
    });
  }

  posterState.selectedIndex = 0;
  renderGalleryGrid();
  renderMasterPoster();
}

async function extractVideoFrames(vPath, count) {
  try {
    const grid = $('posterGalleryGrid');
    if (grid) grid.innerHTML = '<div class="poster-gallery-loading">Probing video & extracting frames…</div>';

    // 1. Probe video file to get exact duration
    const probeRes = await fetch('/api/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: vPath })
    });
    const probeData = await probeRes.json();
    if (!probeRes.ok) throw new Error(probeData.error || 'Failed to probe video file');

    const duration = probeData.duration || 10;
    posterState.images = [];

    const step = (duration * 0.85) / Math.max(1, count);
    const startOffset = Math.max(0.5, duration * 0.05);

    for (let i = 0; i < count; i++) {
      const ts = parseFloat((startOffset + i * step).toFixed(2));
      const url = `/api/thumbnail-at?filePath=${encodeURIComponent(vPath)}&time=${ts}`;
      posterState.images.push({
        id: `vid_${i}_${Date.now()}`,
        dataUrl: url,
        title: `Frame @ ${ts}s`
      });
    }

    posterState.selectedIndex = 0;
    renderGalleryGrid();
    renderMasterPoster();
    toast(`Extracted ${count} frames from ${probeData.fileName || 'video'}!`);
  } catch (err) {
    console.error('[POSTER] Failed to extract video frames:', err);
    toast(err.message || 'Error extracting frames, fallback to AI backdrops', 'error');
    generateAIBackdrops(count);
  }
}

function drawProceduralBackdrop(type, index) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const w = canvas.width;
  const h = canvas.height;

  if (type === 'cyberpunk') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#050515');
    grad.addColorStop(0.5, '#120a2a');
    grad.addColorStop(1, '#2b0638');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Neon grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 2;
    for (let y = h * 0.4; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Vertical vanishing lines
    for (let x = -w; x < w * 2; x += 100) {
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.35);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Glowing laser beams
    ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.35, 300, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'dark_knight') {
    const grad = ctx.createRadialGradient(w / 2, h * 0.4, 50, w / 2, h * 0.4, 900);
    grad.addColorStop(0, '#334155');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Charcoal smoke particles
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rRad = 80 + Math.random() * 200;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.04})`;
      ctx.beginPath();
      ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'fire_ice') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Flames sparks
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(249, 115, 22, ${Math.random() * 0.6})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w * 0.6, Math.random() * h, 3 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'sunset') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.4, '#9a3412');
    grad.addColorStop(0.7, '#ea580c');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Sun flare
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.45, 220, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'gothic') {
    const grad = ctx.createRadialGradient(w / 2, h * 0.35, 30, w / 2, h * 0.35, 750);
    grad.addColorStop(0, '#881337');
    grad.addColorStop(0.5, '#4c0519');
    grad.addColorStop(1, '#090508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'ocean') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(0.5, '#042f2e');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'matrix') {
    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.font = '24px monospace';
    for (let x = 0; x < w; x += 30) {
      for (let y = 30; y < h; y += 40) {
        if (Math.random() > 0.5) ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
      }
    }
  } else {
    // Royal Purple
    const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 900);
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(0.6, '#3b0764');
    grad.addColorStop(1, '#090514');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

function renderGalleryGrid() {
  const grid = $('posterGalleryGrid');
  if (!grid) return;

  grid.innerHTML = '';

  posterState.images.forEach((imgObj, i) => {
    const isSelected = i === posterState.selectedIndex;
    const card = document.createElement('div');
    card.className = `poster-gallery-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <img src="${imgObj.dataUrl}" alt="${imgObj.title}">
      <div class="card-overlay">
        <span class="card-title">${imgObj.title}</span>
        ${isSelected ? '<span class="card-check">✓</span>' : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      posterState.selectedIndex = i;
      const badge = $('posterSelectedBadge');
      if (badge) badge.textContent = `Image #${i + 1} Selected`;

      renderGalleryGrid();
      renderMasterPoster();
    });

    grid.appendChild(card);
  });
}

function renderMasterPoster() {
  const canvas = $('posterCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Set canvas dimensions based on aspect ratio
  if (posterState.aspect === '9:16') {
    canvas.width = 1080;
    canvas.height = 1920;
  } else if (posterState.aspect === '16:9') {
    canvas.width = 1920;
    canvas.height = 1080;
  } else {
    canvas.width = 1080;
    canvas.height = 1080;
  }

  const W = canvas.width;
  const H = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Active image
  const activeImgObj = posterState.images[posterState.selectedIndex];

  if (!activeImgObj) {
    drawFallbackPosterText(ctx, W, H);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Image aspect ratio framing & pan conversion engine (16:9 -> 9:16)
    const imgAspect = img.width / img.height;
    const canvasAspect = W / H;

    if (posterState.fitMode === 'blur') {
      // 1. Draw blurred background filling full canvas
      ctx.save();
      let bRenderW = W, bRenderH = H, bOffX = 0, bOffY = 0;
      if (imgAspect > canvasAspect) {
        bRenderH = H;
        bRenderW = H * imgAspect;
        bOffX = (W - bRenderW) / 2;
      } else {
        bRenderW = W;
        bRenderH = W / imgAspect;
        bOffY = (H - bRenderH) / 2;
      }
      ctx.filter = 'blur(24px) brightness(0.65)';
      ctx.drawImage(img, bOffX, bOffY, bRenderW, bRenderH);
      ctx.restore();

      // 2. Draw intact fitted frame in center
      let fitW = W, fitH = H, fitX = 0, fitY = 0;
      if (imgAspect > canvasAspect) {
        fitW = W;
        fitH = W / imgAspect;
        fitY = (H - fitH) / 2;
      } else {
        fitH = H;
        fitW = H * imgAspect;
        fitX = (W - fitW) / 2;
      }

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24;
      ctx.drawImage(img, fitX, fitY, fitW, fitH);
      ctx.restore();
    } else if (posterState.fitMode === 'crop') {
      // Smart 9:16 Crop with Horizontal Pan
      if (imgAspect > canvasAspect) {
        const cropH = img.height;
        const cropW = cropH * canvasAspect;
        const maxOffX = (img.width - cropW) / 2;
        const cropX = Math.max(0, Math.min(img.width - cropW, (img.width - cropW) / 2 + (posterState.panX * maxOffX)));
        ctx.drawImage(img, cropX, 0, cropW, cropH, 0, 0, W, H);
      } else {
        const cropW = img.width;
        const cropH = cropW / canvasAspect;
        const maxOffY = (img.height - cropH) / 2;
        const cropY = Math.max(0, Math.min(img.height - cropH, (img.height - cropH) / 2 + (posterState.panX * maxOffY)));
        ctx.drawImage(img, 0, cropY, cropW, cropH, 0, 0, W, H);
      }
    } else {
      // Cover Stretch
      let renderW = W, renderH = H, offsetX = 0, offsetY = 0;
      if (imgAspect > canvasAspect) {
        renderH = H;
        renderW = H * imgAspect;
        offsetX = (W - renderW) / 2;
      } else {
        renderW = W;
        renderH = W / imgAspect;
        offsetY = (H - renderH) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    }

    // Apply Color LUT / Grading Filter
    applyColorLUT(ctx, W, H, posterState.lut);

    // Apply Vignette Shadow
    if (posterState.vignette > 0) {
      const vRad = Math.max(W, H) * 0.7;
      const grad = ctx.createRadialGradient(W / 2, H / 2, vRad * 0.3, W / 2, H / 2, vRad);
      const alpha = (posterState.vignette / 100) * 0.85;
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Apply Anamorphic Lens Flare
    if (posterState.flare) {
      const flareY = H * (posterState.verticalPos / 100);
      const gradFlare = ctx.createLinearGradient(0, flareY, W, flareY);
      gradFlare.addColorStop(0, 'rgba(6, 182, 212, 0)');
      gradFlare.addColorStop(0.3, 'rgba(6, 182, 212, 0.25)');
      gradFlare.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
      gradFlare.addColorStop(0.7, 'rgba(245, 158, 11, 0.25)');
      gradFlare.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = gradFlare;
      ctx.fillRect(0, flareY - 12, W, 24);
    }

    // Apply Movie Letterbox Bars
    if (posterState.letterbox) {
      const barH = H * 0.06;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);
    }

    // Draw Studio / Release Badge (Top Header)
    if (posterState.badge && posterState.badge.trim()) {
      ctx.save();
      ctx.font = `600 ${Math.round(W * 0.016)}px 'Montserrat', sans-serif`;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fillText(posterState.badge.toUpperCase(), W / 2, H * 0.09);
      ctx.restore();
    }

    // DRAW MAIN MOVIE TITLE
    if (posterState.mainTitle && posterState.mainTitle.trim()) {
      const titleY = H * (posterState.verticalPos / 100);
      draw3DMovieTitle(ctx, posterState.mainTitle, W / 2, titleY, posterState.tracking, posterState.font, posterState.titleSize, posterState.colorPreset);
    }

    // DRAW TAGLINE / DESCRIPTION BOX
    if (posterState.tagline && posterState.tagline.trim()) {
      ctx.save();
      const taglineY = H * (posterState.verticalPos / 100) + posterState.titleSize * 0.8;
      const tagFontSize = Math.max(18, Math.round(posterState.titleSize * 0.28));
      ctx.font = `500 ${tagFontSize}px 'Montserrat', sans-serif`;
      ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;

      wrapText(ctx, posterState.tagline.toUpperCase(), W / 2, taglineY, W * 0.8, tagFontSize * 1.4);
      ctx.restore();
    }

    // DRAW CREDITS & BILLING (Bottom Footer)
    if (posterState.credits && posterState.credits.trim()) {
      ctx.save();
      const creditsY = H * 0.94;
      const creditsFont = `400 ${Math.round(W * 0.015)}px 'Inter', sans-serif`;
      ctx.font = creditsFont;
      ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;

      ctx.fillText(posterState.credits.toUpperCase(), W / 2, creditsY);
      ctx.restore();
    }
  };
  img.src = activeImgObj.dataUrl;
}

function draw3DMovieTitle(ctx, text, x, y, tracking, font, titleSize, colorPreset) {
  ctx.save();
  ctx.font = `${titleSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const formattedText = text.toUpperCase();

  // 1. Draw 3D Extrusion Shadow Layers (Offset depth for blockbuster Indian movie poster titles)
  const depth = 6;
  for (let i = depth; i > 0; i--) {
    ctx.fillStyle = i === depth ? 'rgba(0, 0, 0, 0.95)' : 'rgba(15, 23, 42, 0.9)';
    drawTrackedText(ctx, formattedText, x + i * 1.5, y + i * 1.5, tracking);
  }

  // 2. Dark Stroke Outline for High Contrast
  ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.06));
  ctx.strokeStyle = '#000000';
  drawTrackedTextStroke(ctx, formattedText, x, y, tracking);

  // 3. Main Gradient Fill
  const fillStyle = getGradientFill(ctx, ctx.canvas.width, y, colorPreset);
  ctx.fillStyle = fillStyle;
  drawTrackedText(ctx, formattedText, x, y, tracking);

  ctx.restore();
}

function drawTrackedTextStroke(ctx, text, x, y, tracking) {
  if (tracking <= 0) {
    ctx.strokeText(text, x, y);
    return;
  }
  const chars = text.split('');
  let totalWidth = 0;
  chars.forEach(char => {
    totalWidth += ctx.measureText(char).width + tracking;
  });
  totalWidth -= tracking;

  let startX = x - totalWidth / 2;
  chars.forEach(char => {
    const charW = ctx.measureText(char).width;
    ctx.strokeText(char, startX + charW / 2, y);
    startX += charW + tracking;
  });
}

function drawTrackedText(ctx, text, x, y, tracking) {
  if (tracking <= 0) {
    ctx.fillText(text, x, y);
    return;
  }

  const chars = text.split('');
  let totalWidth = 0;
  chars.forEach(char => {
    totalWidth += ctx.measureText(char).width + tracking;
  });
  totalWidth -= tracking; // remove trailing space

  let startX = x - totalWidth / 2;
  chars.forEach(char => {
    const charW = ctx.measureText(char).width;
    ctx.fillText(char, startX + charW / 2, y);
    startX += charW + tracking;
  });
}

function getGradientFill(ctx, W, Y, preset) {
  let grad;
  switch (preset) {
    case 'gold':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      return grad;
    case 'yellow-red':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.35, '#eab308');
      grad.addColorStop(0.7, '#dc2626');
      grad.addColorStop(1, '#7f1d1d');
      return grad;
    case 'cyan':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#cffafe');
      grad.addColorStop(0.5, '#06b6d4');
      grad.addColorStop(1, '#0e7490');
      return grad;
    case 'crimson':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#fecdd3');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      return grad;
    case 'silver':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(1, '#475569');
      return grad;
    case 'fire':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, '#c2410c');
      return grad;
    case 'emerald':
      grad = ctx.createLinearGradient(0, Y - 40, 0, Y + 40);
      grad.addColorStop(0, '#a7f3d0');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(1, '#047857');
      return grad;
    default:
      return '#ffffff';
  }
}

function applyColorLUT(ctx, W, H, lut) {
  if (lut === 'none') return;

  ctx.save();
  if (lut === 'teal-orange') {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.globalCompositeOperation = 'color-burn';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0, 0, W, H);
  } else if (lut === 'cyberpunk') {
    ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(0, 0, W, H);
  } else if (lut === 'noir') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillRect(0, 0, W, H);
  } else if (lut === 'golden') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
    ctx.globalCompositeOperation = 'color';
    ctx.fillRect(0, 0, W, H);
  } else if (lut === 'cold-matrix') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.globalCompositeOperation = 'color-dodge';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function drawFallbackPosterText(ctx, W, H) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#64748b';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('No Image Selected', W / 2, H / 2);
}

function downloadPoster() {
  const canvas = $('posterCanvas');
  if (!canvas) return;

  const link = document.createElement('a');
  const filename = `poster_${posterState.mainTitle.replace(/\s+/g, '_').toLowerCase() || 'design'}_${posterState.aspect.replace(':', 'x')}.png`;
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast(`Downloaded ${filename}!`);
}

async function savePosterToServer() {
  const canvas = $('posterCanvas');
  if (!canvas) return;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `poster_${Date.now()}.png`;

    const res = await fetch('/api/save-poster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename })
    });

    const data = await res.json();
    if (data.success) {
      toast(`Poster saved to server: ${data.filePath}`);
    } else {
      throw new Error(data.error || 'Failed to save poster');
    }
  } catch (err) {
    console.error(err);
    toast(err.message || 'Error saving poster', 'error');
  }
}

async function copyPosterToClipboard() {
  const canvas = $('posterCanvas');
  if (!canvas) return;

  try {
    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Canvas blob failed');
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      toast('Poster copied to clipboard!');
    });
  } catch (err) {
    console.error(err);
    toast('Copy to clipboard not supported on this browser', 'error');
  }
}
