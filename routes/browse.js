const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');

let isBrowsing = false;
let isBrowsingFolder = false;

router.post('/browse', (req, res) => {
  if (isBrowsing) {
    return res.status(409).json({ error: 'A file dialog is already open. Please close it first.' });
  }
  isBrowsing = true;
  console.log('[BROWSE] Opening file dialog...');
  const scriptPath = path.join(__dirname, '..', 'browse.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });
  ps.on('close', code => {
    isBrowsing = false;
    console.log(`[BROWSE] PowerShell closed with code ${code}`);
    if (code === 0) {
      console.log(`[BROWSE] Selected: ${stdout.trim()}`);
      res.json({ success: true, filePath: stdout.trim() });
    } else {
      console.error(`[BROWSE] Error details: ${stderr}`);
      res.status(500).json({ error: `Browse failed: ${stderr}` });
    }
  });
  ps.on('error', err => {
    isBrowsing = false;
    console.error('[BROWSE] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open file dialog' });
  });
});

router.post('/browse-folder', (req, res) => {
  if (isBrowsingFolder) {
    return res.status(409).json({ error: 'A folder dialog is already open. Please close it first.' });
  }
  isBrowsingFolder = true;
  console.log('[BROWSE-FOLDER] Opening folder dialog...');
  const scriptPath = path.join(__dirname, '..', 'browse-folder.ps1');
  const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
  let stdout = '', stderr = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.stderr.on('data', d => { stderr += d.toString(); });
  ps.on('close', code => {
    isBrowsingFolder = false;
    console.log(`[BROWSE-FOLDER] PowerShell closed with code ${code}`);
    if (code === 0) {
      console.log(`[BROWSE-FOLDER] Selected: ${stdout.trim()}`);
      res.json({ success: true, folderPath: stdout.trim() });
    } else {
      console.error(`[BROWSE-FOLDER] Error details: ${stderr}`);
      res.status(500).json({ error: `Folder browse failed: ${stderr}` });
    }
  });
  ps.on('error', err => {
    isBrowsingFolder = false;
    console.error('[BROWSE-FOLDER] Spawn error:', err);
    res.status(500).json({ error: 'Failed to open folder dialog' });
  });
});

module.exports = router;
