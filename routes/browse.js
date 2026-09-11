const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');

let isBrowsing = false;
let browseLockTime = 0;
let isBrowsingFolder = false;
let browseFolderLockTime = 0;

function handleBrowseFile(req, res) {
  const now = Date.now();
  // Auto-reset lock if stuck for > 45 seconds
  if (isBrowsing && (now - browseLockTime > 45000)) {
    console.warn('[BROWSE] Resetting stale browse lock...');
    isBrowsing = false;
  }

  if (isBrowsing && !req.query.force) {
    return res.status(409).json({ error: 'A file dialog is already open. Please close it first.' });
  }

  isBrowsing = true;
  browseLockTime = Date.now();
  console.log('[BROWSE] Opening file dialog...');
  const scriptPath = path.join(__dirname, '..', 'browse.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });

  ps.on('close', code => {
    isBrowsing = false;
    console.log(`[BROWSE] PowerShell closed with code ${code}`);
    const selectedPath = stdout.trim();
    if (code === 0 || selectedPath) {
      console.log(`[BROWSE] Selected: ${selectedPath}`);
      res.json({ success: true, filePath: selectedPath });
    } else {
      console.error(`[BROWSE] Error details: ${stderr}`);
      res.status(500).json({ error: `Browse failed: ${stderr || 'Unknown error'}` });
    }
  });

  ps.on('error', err => {
    isBrowsing = false;
    console.error('[BROWSE] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open file dialog' });
  });
}

function handleBrowseFolder(req, res) {
  const now = Date.now();
  if (isBrowsingFolder && (now - browseFolderLockTime > 45000)) {
    console.warn('[BROWSE-FOLDER] Resetting stale folder browse lock...');
    isBrowsingFolder = false;
  }

  if (isBrowsingFolder && !req.query.force) {
    return res.status(409).json({ error: 'A folder dialog is already open. Please close it first.' });
  }

  isBrowsingFolder = true;
  browseFolderLockTime = Date.now();
  console.log('[BROWSE-FOLDER] Opening folder dialog...');
  const scriptPath = path.join(__dirname, '..', 'browse-folder.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });

  ps.on('close', code => {
    isBrowsingFolder = false;
    console.log(`[BROWSE-FOLDER] PowerShell closed with code ${code}`);
    const selectedPath = stdout.trim();
    if (code === 0 || selectedPath) {
      console.log(`[BROWSE-FOLDER] Selected: ${selectedPath}`);
      res.json({ success: true, folderPath: selectedPath, filePath: selectedPath });
    } else {
      console.error(`[BROWSE-FOLDER] Error details: ${stderr}`);
      res.status(500).json({ error: `Folder browse failed: ${stderr || 'Unknown error'}` });
    }
  });

  ps.on('error', err => {
    isBrowsingFolder = false;
    console.error('[BROWSE-FOLDER] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open folder dialog' });
  });
}

// Support GET & POST for /browse, /browse-file, /browse-folder
router.post('/browse', handleBrowseFile);
router.get('/browse', handleBrowseFile);

router.post('/browse-file', handleBrowseFile);
router.get('/browse-file', handleBrowseFile);

router.post('/browse-folder', handleBrowseFolder);
router.get('/browse-folder', handleBrowseFolder);

module.exports = router;
