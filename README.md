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
