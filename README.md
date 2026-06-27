# 🎬 AIVERSE STUDIOS — Futuristic AI-Powered Short Video Engine

> **Simplify Director Vision. Amplify Producer Profits.**
> **Justify Audience Experience.**

AIVERSE STUDIOS is a high-performance, web-based local video processing studio designed to handle large media files (8GB+) and automatically generate vertical YouTube Shorts, Instagram Reels, and TikTok clips. By pairing a custom client-side visual editor with an asynchronous FFmpeg rendering queue, the application delivers absolute speed and system stability.

---

## ⚡ Key Features

### 1. 🎞️ Crop Studio (16:9 to 9:16 Visual Trimmer)
* **Interactive 9:16 Frame Panner**: Drag and adjust a crop box over a 16:9 video frame to pan left/right without stretching or distorting characters.
* **Real-time Canvas Renderer**: Instantly translates and previews the exact 9:16 vertical crop.
* **Interactive Timeline Cutter**: Hover-scrub and seek frame-by-frame with full keyboard shortcut support (`Space` for Play/Pause, `I`/`O` for In/Out points, arrow keys for frame stepping).

### 2. 🎲 Random Clips Generator
* **Automatic Overlap-Free Clip Generation**: Randomly extracts non-overlapping video segments using smart mathematical spacing algorithms.
* **Flexible Presets**: Generate batches of clips with custom durations (`5s`, `8s`, `10s`, `15s`) and custom limits up to **100 clips** per run.
* **Proposed Clips Timeline Visualizer**: A visual horizontal bar displaying the exact positions of your generated random clips before rendering.
* **Interactive Pre-render Review**: Toggle checkmarks to include/exclude clips, preview them inside a mockup 9:16 phone screen, adjust panning offsets, or re-roll individual clips on the fly.

### 3. 🚦 Background Sequential Queue
* **Concurrency-limited Queue Engine**: Processes FFmpeg render jobs sequentially in the background (limiting to a maximum of 2 parallel renders).
* **System Protection**: Stops CPU spikes and memory exhaustion to prevent the host computer from freezing or hanging during large batch exports.
* **Archived Shorts Library**: Scans completed exports inside `shorts/` folders and shows them dynamically in a browser-playable card at the bottom right.

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
1. **Node.js** (v16+)
2. **FFmpeg** (Must be installed and added to your system's Environment Variables `PATH` so it can be called globally via the command line).

---

## 🚀 Installation & Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AloneuAshu/aiverse-studios.git
   cd aiverse-studios
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   Go to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Directory Structure

* `/public` - Contains frontend client files (`index.html`, `app.js`, `style.css`).
* `server.js` - Express backend with asynchronous queue execution and metadata probing.
* `browse.ps1` & `browse-folder.ps1` - PowerShell dialog wrappers for native file selection window.
* `/shorts` - Contains exported vertical shorts organized by duration subfolders (`5s`, `8s`, `10s`, `15s`).
* `package.json` - Declares project details and dependencies.

---

## ⌨️ Keyboard Shortcuts (Crop Studio Timeline)
* `Spacebar` - Play / Pause the video
* `I` - Set In Point (Start of crop)
* `O` - Set Out Point (End of crop)
* `Left Arrow` - Move 1 frame backward
* `Right Arrow` - Move 1 frame forward
