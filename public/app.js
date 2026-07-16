import { $ } from './modules/utils.js';
import { initBatchGen } from './modules/batch-gen.js';
import { initRandomGen } from './modules/random-gen.js';
import { initCropStudio } from './modules/crop-studio.js';
import { initSubtitles } from './modules/subtitles.js';
import { initTrimStudio } from './modules/trim-studio.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Fetch and load panel templates
    const container = $('appPanelContainer');
    if (!container) throw new Error('App Panel container missing');

    const panels = [
      { id: 'batch-gen', file: 'batch-gen.html' },
      { id: 'random-gen', file: 'random-gen.html' },
      { id: 'crop-studio', file: 'crop-studio.html' },
      { id: 'subtitle-studio', file: 'subtitle-studio.html' },
      { id: 'trim-studio', file: 'trim-studio.html' }
    ];

    for (const p of panels) {
      const resp = await fetch(`/panels/${p.file}`);
      if (!resp.ok) throw new Error(`Failed to load panel: ${p.file}`);
      const html = await resp.text();
      
      // Append layout template directly inside the wrapper
      container.insertAdjacentHTML('beforeend', html);
    }

    // 2. Initialize feature modules
    initBatchGen();
    initRandomGen();
    initCropStudio();
    initSubtitles();
    initTrimStudio();

    // 3. Setup global tab switching coordination
    initTabNav();

    // 4. Setup sidebar collapse toggler
    initSidebarCollapse();
  } catch (err) {
    console.error('[Initialization Error]:', err);
  }
});

function initTabNav() {
  const tabs = document.querySelectorAll('.sidebar-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.dataset.tab;

      // Hide all panels
      const panels = document.querySelectorAll('.tab-panel');
      panels.forEach(p => p.classList.add('hidden'));

      // Run cleanup operations on tab switch
      if (targetTab !== 'cropStudio' && typeof window.cleanupCropStudio === 'function') {
        window.cleanupCropStudio();
      }

      // Map button data attributes to exact panel IDs
      const panelIdMap = {
        batchGen: 'panelBatchGen',
        randomGen: 'panelRandomGen',
        cropStudio: 'panelCropStudio',
        subtitles: 'panelSubtitles',
        trimStudio: 'panelTrimStudio'
      };

      const targetPanelId = panelIdMap[targetTab];
      const panel = $(targetPanelId);
      if (panel) {
        panel.classList.remove('hidden');
      }
    });
  });
}

function initSidebarCollapse() {
  const sidebar = $('appSidebar');
  const toggleBtn = $('btnSidebarToggle');
  if (!sidebar || !toggleBtn) return;

  // Restore state from localStorage
  const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (savedCollapsed) {
    sidebar.classList.add('collapsed');
    toggleBtn.textContent = '▶';
  } else {
    sidebar.classList.remove('collapsed');
    toggleBtn.textContent = '◀';
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    toggleBtn.textContent = isCollapsed ? '▶' : '◀';
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  });
}
