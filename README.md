# AnimePlayerLocal 🎬

Local Anime Video Player Webapp — Server runs on your PC, streams anime videos over LAN to mobile browsers with advanced subtitle rendering support.

## Features

- **File Browser**: Browse anime video files from your computer on your phone's browser.
- **Video Streaming**: Smooth streaming using HTTP Range Requests.
- **Embedded Subtitles**: Detects and extracts embedded subtitles from MKV/MP4 containers via FFprobe/FFmpeg.
- **External Subtitles**: Auto-matches external subtitles (`.ass`, `.srt`, `.vtt`) from a designated subtitle directory.
- **WASM Subtitle Rendering**: Leverages JASSUB (libass WebAssembly) for full typesetting and styling of ASS/SSA subtitles.
- **Subtitle Timing Adjustment**: Real-time timing offset adjustments (±0.1s, ±0.5s, ±1.0s) directly from the mobile UI.

## Tech Stack

### Frontend
- React 19 + Vite 8
- TypeScript
- Zustand (State management)
- JASSUB (libass WASM subtitle renderer)
- Vanilla CSS (CSS Modules)

### Backend
- Node.js + Express.js
- fluent-ffmpeg (FFmpeg/FFprobe wrapper)
- chokidar (File system watch)
- zod (Validation)

### Testing
- Vitest (Test Runner)
- React Testing Library + jsdom
- Supertest (API testing)

---

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- FFmpeg installed and configured on your path

### Setup Workspaces & Dependencies
At the root directory, install the workspaces dependencies:
```bash
npm install --legacy-peer-deps
```

### Running Locally (LAN Development)
To launch both client and server development servers concurrently:
```bash
npm run dev
```
- Frontend Client: [http://localhost:5173](http://localhost:5173)
- Backend API Server: [http://localhost:3000](http://localhost:3000)

### Running Tests
To run all test suites (client + server):
```bash
npm run test
```

### Production Build & Deployment
To build both client and server workspaces for production:
1. Build the workspaces:
   ```bash
   npm run build
   ```
2. Start the backend production server:
   ```bash
   npm run start -w server
   ```
   *Note: Ensure your `config.json` or `.env` contains the correct paths, or configure them directly from the UI settings on your mobile device.*

---

## LAN Access & Mobile Setup

1. **Terminal QR Code**: When the backend server starts, it scans your network cards, identifies your local LAN IP (e.g., `192.168.1.15`), and prints a large **QR code** directly in your terminal console.
2. **Connecting**: Scan this QR code using your mobile device's camera or a QR scanner app to connect immediately to the LAN player.
3. **PWA (Progressive Web App)**: Once opened on your mobile device (Safari on iOS or Chrome on Android), tap **"Add to Home Screen"** to install it as a native standalone app for fullscreen edge-to-edge playback.

## Folder Configuration via Web Settings
- You can configure the directory paths on the PC directly from your mobile device!
- Click the **Gear icon** in the top header of the browser screen to open the **Cài Đặt Hệ Thống (Settings Panel)**.
- Input your PC's folders for **Thư mục Video (PC)** and **Thư mục Phụ đề rời (PC)**, then tap **Lưu Cấu Hình (Save)**. The server will write these configurations dynamically to its local `config.json` and reload lists.

