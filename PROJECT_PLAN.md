# 🎬 AnimePlayerLocal — Project Plan

> **Local Anime Video Player Webapp** — Server chạy trên PC, phát video anime qua mạng LAN lên trình duyệt điện thoại với hỗ trợ subtitle nâng cao.

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack Đề Xuất](#3-tech-stack-đề-xuất)
4. [Cấu Trúc Thư Mục Dự Án](#4-cấu-trúc-thư-mục-dự-án)
5. [Chi Tiết Tính Năng](#5-chi-tiết-tính-năng)
6. [Thiết Kế UI/UX — Mobile-First](#6-thiết-kế-uiux--mobile-first)
7. [Chiến Lược TDD](#7-chiến-lược-tdd)
8. [Phân Pha Thực Hiện](#8-phân-pha-thực-hiện)
9. [API Design](#9-api-design)
10. [Quyết Định Thiết Kế (Đã Xác Nhận)](#10-quyết-định-thiết-kế-đã-xác-nhận)
11. [Rủi Ro & Giải Pháp](#11-rủi-ro--giải-pháp)

---

## 1. Tổng Quan Dự Án

### Mô tả
Một **webapp kiến trúc Client-Server qua mạng LAN** cho phép người dùng xem anime từ điện thoại. **Server Node.js chạy trên máy tính (PC/Windows)**, nơi chứa toàn bộ video anime và file subtitle. Người dùng mở **trình duyệt trên điện thoại** (cùng mạng WiFi) để duyệt và phát video qua giao diện web được tối ưu cho mobile.

### Mô Hình Sử Dụng

```
📱 Điện thoại (Client)                    💻 Máy tính (Server)
┌─────────────────────┐                   ┌──────────────────────────┐
│  Chrome/Safari/Edge │  ◄── WiFi/LAN ──► │  Node.js Server          │
│  Mobile Browser     │   http://192.168. │  (Express.js)            │
│                     │   x.x:3000        │                          │
│  • Xem danh sách    │                   │  📂 E:\Anime\            │
│  • Phát video       │                   │    ├── Psycho-Pass\      │
│  • Chọn subtitle    │                   │    │   ├── EP01.mkv      │
│  • Chỉnh timing     │                   │    │   ├── EP01.ass      │
│                     │                   │    │   └── EP02.mkv      │
│  Không cần cài app  │                   │    └── AoT\             │
│  Không lưu file     │                   │        ├── EP01.mp4     │
│                     │                   │        └── EP01.srt     │
└─────────────────────┘                   │                          │
                                          │  📦 FFmpeg/FFprobe       │
                                          │  (extract embedded subs) │
                                          └──────────────────────────┘
```

> **Điểm then chốt:** Tất cả file video (MKV/MP4) và file subtitle (ASS/SRT/VTT...) đều nằm trên **máy tính**. Điện thoại chỉ là thiết bị xem — không cần download hay upload bất kỳ file nào.

### Mục tiêu chính
- ✅ Duyệt và chọn video từ thư mục trên máy tính (qua API server)
- ✅ Stream video MKV/MP4 qua mạng LAN lên trình duyệt điện thoại
- ✅ Quản lý subtitle embedded (soft sub) — bật/tắt/chuyển track
- ✅ Chọn subtitle ngoài từ file trên máy tính (ASS, SRT, VTT, SSA, SUB)
- ✅ Điều chỉnh timing subtitle (±0.1s, ±0.5s, ±1s)
- ✅ Giao diện tối ưu 100% cho trình duyệt mobile
- ✅ Phát triển theo phương pháp TDD

---

## 2. Kiến Trúc Hệ Thống

```
   📱 ĐIỆN THOẠI (Client)                          💻 MÁY TÍNH / PC (Server)
   Trình duyệt mobile                              Windows — Node.js
┌─────────────────────────┐                    ┌──────────────────────────────────┐
│                         │                    │                                  │
│  ┌───────────────────┐  │   WiFi / LAN       │  Express.js API Server           │
│  │  File Browser     │  │   ════════════     │  (bind 0.0.0.0:3000)             │
│  │  Component        │──┼──► GET /api/videos │                                  │
│  └───────────────────┘  │                    │  ┌────────┐ ┌──────────────────┐ │
│                         │                    │  │ File   │ │ Subtitle Scanner │ │
│  ┌───────────────────┐  │                    │  │ Scanner│ │ (video + .ass/   │ │
│  │  Video Player     │──┼──► GET /stream     │  │(.mkv   │ │  .srt/.vtt files │ │
│  │  Component        │  │   (Range Request)  │  │ .mp4)  │ │  cùng thư mục)   │ │
│  └───────────────────┘  │                    │  └────┬───┘ └────────┬─────────┘ │
│                         │                    │       │              │           │
│  ┌───────────────────┐  │                    │  ┌────┴──────────────┴─────────┐ │
│  │  Subtitle Manager │──┼──► GET /subtitles  │  │        FFmpeg / FFprobe      │ │
│  │  + Timing Control │  │                    │  │  • Extract embedded subs     │ │
│  └───────────────────┘  │                    │  │  • Get video metadata        │ │
│                         │                    │  └────────────┬───────────────┘ │
│  React + Zustand        │                    │               │                  │
│  JASSUB (ASS render)    │                    │     Local File System (PC)       │
│                         │                    │     📂 E:\Anime\                 │
│  Không lưu file nào     │                    │     📂 E:\Subtitles\ (optional)  │
│  trên điện thoại        │                    │                                  │
└─────────────────────────┘                    └──────────────────────────────────┘
```

### Network Configuration

| Thông số | Giá trị |
|:---|:---|
| **Server bind** | `0.0.0.0:3000` (chấp nhận kết nối từ mọi thiết bị trong LAN) |
| **Client truy cập** | `http://<IP-máy-tính>:3000` (ví dụ: `http://192.168.1.100:3000`) |
| **Giao thức** | HTTP (không cần HTTPS vì chạy trong mạng nội bộ) |
| **CORS** | Cho phép tất cả origin từ private network |
| **Auto-discovery** | Server hiển thị IP LAN khi khởi động, hoặc QR code để scan từ điện thoại |

### Luồng hoạt động chính

1. **Khởi động server trên PC** → Scan thư mục video + subtitle → Hiển thị IP LAN trên console
2. **Mở trình duyệt trên điện thoại** → Nhập `http://192.168.x.x:3000` → Hiển thị danh sách video
3. **Chọn video** → Server stream video qua HTTP Range Request qua WiFi
4. **Subtitle embedded** → Server dùng FFprobe phát hiện → FFmpeg extract → Gửi text về điện thoại
5. **Subtitle ngoài** → Server scan file `.ass/.srt/.vtt` từ thư mục subtitle riêng (cấu hình qua config/UI) → Client chọn để load
6. **Timing adjustment** → Client-side offset xử lý real-time trên điện thoại

---

## 3. Tech Stack Đề Xuất

### Frontend

| Thành phần | Công nghệ | Lý do |
|:---|:---|:---|
| **Framework** | **React 19** + **Vite 6** | Nhanh, HMR tốt, ecosystem phong phú |
| **Ngôn ngữ** | **TypeScript** | Type safety, refactor dễ dàng, phù hợp TDD |
| **Styling** | **Vanilla CSS** (CSS Modules) | Tối ưu performance, không overhead framework CSS |
| **State Management** | **Zustand** | Nhẹ (~1KB), persist middleware sẵn, API đơn giản |
| **ASS Subtitle Render** | **JASSUB** (libass WASM) | Render ASS/SSA chuẩn nhất, dùng WebGL |
| **SRT/VTT Parse** | **subtitle.js** hoặc custom parser | Parse các format subtitle text-based |
| **HTTP Client** | **fetch API** (native) | Không cần thêm thư viện |
| **Icons** | **Lucide React** | Nhẹ, đẹp, tree-shakeable |

### Backend

| Thành phần | Công nghệ | Lý do |
|:---|:---|:---|
| **Runtime** | **Node.js 20+** | Xử lý file system, streaming |
| **Framework** | **Express.js** | Đơn giản, mature, đủ cho local server |
| **Video Processing** | **fluent-ffmpeg** | Wrapper cho FFmpeg/FFprobe, extract subtitle |
| **File Watching** | **chokidar** | Watch thay đổi trong thư mục video |
| **Validation** | **zod** | Schema validation cho API |

### Testing (TDD)

| Thành phần | Công nghệ | Lý do |
|:---|:---|:---|
| **Test Runner** | **Vitest** | Nhanh, tích hợp Vite, API tương tự Jest |
| **Component Testing** | **React Testing Library** | Test behavior, không test implementation |
| **API Testing** | **Supertest** | Test Express endpoints |
| **E2E (optional)** | **Playwright** | Test toàn luồng trên trình duyệt thật |
| **Coverage** | **v8** (built-in Vitest) | Code coverage tracking |

### Yêu Cầu Hệ Thống

| Yêu cầu | Thiết bị | Chi tiết |
|:---|:---|:---|
| **FFmpeg** | PC (Server) | Cần cài đặt trên máy tính (dùng để extract subtitle từ MKV) |
| **Node.js** | PC (Server) | v20 trở lên |
| **Mạng** | Cả hai | PC và điện thoại cùng mạng WiFi/LAN |
| **Trình duyệt** | Điện thoại | Chrome/Safari/Edge mobile hiện đại (hỗ trợ WASM, WebGL) |
| **Dung lượng** | PC | Không gian đĩa cho video anime + subtitle files |

---

## 4. Cấu Trúc Thư Mục Dự Án

```
AnimePlayerLocal/
├── .agents/                     # Agent customizations
├── client/                      # Frontend (React + Vite)
│   ├── public/
│   │   └── jassub-worker/       # JASSUB WASM worker files
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileBrowser/
│   │   │   │   ├── FileBrowser.tsx
│   │   │   │   ├── FileBrowser.module.css
│   │   │   │   ├── FileBrowser.test.tsx
│   │   │   │   ├── VideoCard.tsx
│   │   │   │   ├── VideoCard.module.css
│   │   │   │   └── VideoCard.test.tsx
│   │   │   ├── VideoPlayer/
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── VideoPlayer.module.css
│   │   │   │   ├── VideoPlayer.test.tsx
│   │   │   │   ├── VideoControls.tsx
│   │   │   │   ├── VideoControls.module.css
│   │   │   │   └── VideoControls.test.tsx
│   │   │   ├── SubtitleManager/
│   │   │   │   ├── SubtitleManager.tsx
│   │   │   │   ├── SubtitleManager.module.css
│   │   │   │   ├── SubtitleManager.test.tsx
│   │   │   │   ├── SubtitleTrackSelector.tsx
│   │   │   │   ├── SubtitleTrackSelector.test.tsx
│   │   │   │   ├── SubtitleTimingControl.tsx
│   │   │   │   ├── SubtitleTimingControl.module.css
│   │   │   │   └── SubtitleTimingControl.test.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Slider.tsx
│   │   ├── hooks/
│   │   │   ├── useVideoPlayer.ts
│   │   │   ├── useVideoPlayer.test.ts
│   │   │   ├── useSubtitle.ts
│   │   │   ├── useSubtitle.test.ts
│   │   │   ├── useSubtitleTiming.ts
│   │   │   └── useSubtitleTiming.test.ts
│   │   ├── services/
│   │   │   ├── api.ts                # API client
│   │   │   ├── api.test.ts
│   │   │   ├── subtitleParser.ts     # Parse SRT/VTT/ASS
│   │   │   └── subtitleParser.test.ts
│   │   ├── store/
│   │   │   ├── playerStore.ts
│   │   │   └── playerStore.test.ts
│   │   ├── types/
│   │   │   ├── video.ts
│   │   │   └── subtitle.ts
│   │   ├── styles/
│   │   │   ├── variables.css        # CSS custom properties
│   │   │   ├── reset.css            # CSS reset
│   │   │   └── global.css           # Global styles
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                       # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── videoRoutes.ts
│   │   │   ├── videoRoutes.test.ts
│   │   │   ├── subtitleRoutes.ts
│   │   │   └── subtitleRoutes.test.ts
│   │   ├── services/
│   │   │   ├── fileScanner.ts       # Scan video directory
│   │   │   ├── fileScanner.test.ts
│   │   │   ├── subtitleScanner.ts   # Scan external subtitle files (.ass/.srt/.vtt)
│   │   │   ├── subtitleScanner.test.ts
│   │   │   ├── videoStreamer.ts      # HTTP range streaming
│   │   │   ├── videoStreamer.test.ts
│   │   │   ├── subtitleExtractor.ts  # FFmpeg extract embedded subs
│   │   │   ├── subtitleExtractor.test.ts
│   │   │   ├── networkInfo.ts       # Get LAN IP, generate QR code
│   │   │   └── networkInfo.test.ts
│   │   ├── middleware/
│   │   │   └── cors.ts              # CORS cho LAN access
│   │   ├── config/
│   │   │   └── index.ts             # Config (video path, subtitle path, port, bind address)
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── app.ts                   # Express app setup (bind 0.0.0.0)
│   │   └── server.ts                # Entry point — hiển thị LAN IP khi start
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── shared/                       # Shared types/utils
│   ├── types.ts
│   └── constants.ts
├── PROJECT_PLAN.md               # File này
├── package.json                  # Root workspace config
└── README.md
```

---

## 5. Chi Tiết Tính Năng

### 5.1 File Browser — Duyệt Video

**Mô tả:** Hiển thị danh sách video có trong thư mục được cấu hình.

| Tính năng | Chi tiết |
|:---|:---|
| Scan thư mục | Đệ quy scan tất cả file `.mkv`, `.mp4` trong thư mục đã cấu hình (cấu hình qua `.env` + UI) |
| Hiển thị | Grid layout (mobile: 1-2 cột, tablet: 3 cột, desktop: 4-5 cột) |
| Thông tin file | Tên file, kích thước, thời lượng (từ FFprobe), placeholder icon (không generate thumbnail) |
| Tìm kiếm | Search bar filter theo tên file |
| Sắp xếp | Theo tên, ngày modified, kích thước |
| Nhóm | Tự động nhóm theo thư mục con (tên anime series) |
| Auto-refresh | Dùng `chokidar` để watch thay đổi, tự cập nhật danh sách |

### 5.2 Video Player — Phát Video

**Mô tả:** Player HTML5 tùy chỉnh với UI mobile-friendly.

| Tính năng | Chi tiết |
|:---|:---|
| Streaming | HTTP Range Request — cho phép seek không cần download toàn bộ |
| Định dạng | MP4 phát trực tiếp; MKV gửi trực tiếp (Chrome/Edge mobile hỗ trợ) |
| Controls | Play/Pause, Seek bar, Volume, Fullscreen |
| Gesture (mobile) | Double-tap trái/phải để skip ±10s, swipe up/down để chỉnh volume/brightness |
| Picture-in-Picture | Hỗ trợ PiP trên trình duyệt có hỗ trợ |
| Resume | Lưu vị trí đã xem, tiếp tục từ lần trước |
| Audio tracks | Cho phép chọn audio track khi video có nhiều audio (ví dụ: JPN, ENG) |
| Keyboard shortcuts | Space (play/pause), ← → (seek), F (fullscreen), M (mute) |

### 5.3 Subtitle Manager — Quản Lý Subtitle

#### 5.3.1 Embedded Subtitle (Soft Sub)

```
Luồng xử lý:
Video được chọn → FFprobe phát hiện subtitle tracks
   → Liệt kê: [Track 1: Vietnamese (ASS), Track 2: English (SRT), ...]
   → User chọn track → FFmpeg extract → Gửi nội dung sub về client
   → JASSUB/TextTrack render subtitle lên video
   → User có thể tắt subtitle (Off)
```

| Tính năng | Chi tiết |
|:---|:---|
| Phát hiện | FFprobe tự động detect tất cả subtitle streams trong video |
| Hiển thị | Dropdown/Bottom sheet liệt kê các track (ngôn ngữ + format) |
| Extract | FFmpeg extract track được chọn → trả về nội dung text |
| Render ASS | JASSUB (libass WASM) render chuẩn với đầy đủ effect, styling |
| Render SRT/VTT | Chuyển thành WebVTT → dùng native `<track>` element |
| Tắt subtitle | Nút toggle on/off, mặc định tự bật track đầu tiên |
| Cache | Cache subtitle đã extract để không phải extract lại |

#### 5.3.2 External Subtitle (File trên máy tính — thư mục riêng)

> **Lưu ý quan trọng:** File subtitle ngoài nằm trên **máy tính (server)** trong **thư mục riêng** (không cùng thư mục video). Đường dẫn thư mục subtitle được cấu hình qua `.env`/`config.json` và có thể thay đổi từ giao diện điện thoại.

```
Luồng xử lý External Subtitle:

📂 E:\Anime\                        ← Thư mục video (VIDEO_DIR)
   └── Psycho-Pass\
       ├── EP01.mkv
       └── EP02.mkv

📂 E:\Subtitles\                     ← Thư mục subtitle riêng (SUBTITLE_DIR)
   └── Psycho-Pass\
       ├── EP01.ass
       ├── EP01.vie.srt
       ├── EP01.eng.ass
       └── [AC] Psycho-Pass - 01.ass

Khi chọn video EP01.mkv:
   → Server tìm trong SUBTITLE_DIR file có tên matching "EP01"
   → API trả về danh sách subtitle cho client
   → User chọn file trên điện thoại → Server đọc file → Gửi nội dung về client
   → Client render subtitle
```

| Tính năng | Chi tiết |
|:---|:---|
| Thư mục riêng | Subtitle nằm trong thư mục riêng, cấu hình qua `.env` + UI settings |
| Auto-matching | Server tìm file subtitle matching tên video (EP01.mkv → EP01.*.ass/srt/vtt) |
| Browse thư mục | Cho phép browse thư mục subtitle khác trên PC từ giao diện điện thoại |
| Định dạng hỗ trợ | `.ass`, `.ssa`, `.srt`, `.vtt`, `.sub` (MicroDVD) |
| Xử lý | Server đọc file → gửi nội dung text → client parse & render |
| Nhiều file | Có thể chọn từ nhiều file subtitle, hiển thị 1 tại 1 thời điểm |
| Encoding detection | Server auto-detect encoding (UTF-8, Shift-JIS, GB2312...) trước khi gửi |

#### 5.3.3 Subtitle Timing Adjustment

**Đây là tính năng cốt lõi** — cho phép dịch thời gian subtitle khi bị lệch so với audio/video.

```
┌──────────────────────────────────────────────┐
│  Subtitle Timing Offset                       │
│                                                │
│  ◄◄ -1s  ◄ -0.5s  ◄ -0.1s  [+0.0s]  ► +0.1s  ► +0.5s  ►► +1s  │
│                                                │
│  Current offset: +0.3s                         │
│  [Reset]                                       │
└──────────────────────────────────────────────┘
```

| Tính năng | Chi tiết |
|:---|:---|
| Mức dịch | ±0.1s, ±0.5s, ±1s (6 nút bấm) |
| Hiển thị | Hiện offset hiện tại (ví dụ: "+0.3s", "-1.2s") |
| Áp dụng | Real-time, không cần reload video |
| Reset | Nút reset về 0.0s |
| Lưu trạng thái | Nhớ offset cho mỗi cặp video + subtitle |
| Vị trí UI | Nằm trong video controls bar, có thể expand/collapse |

**Cơ chế kỹ thuật:**
- **Với SRT/VTT (text-based):** Dịch timestamp của từng cue bằng offset
- **Với ASS (JASSUB):** Sử dụng API `setCurrentTime()` với offset compensation, hoặc modify dialogue timing trước khi load
- Offset được áp dụng bằng cách điều chỉnh thời gian hiển thị: `displayTime = originalTime + offset`

---

## 6. Thiết Kế UI/UX — Mobile-First

### 6.1 Design Principles

- **Dark theme mặc định** — phù hợp xem video, giảm mỏi mắt
- **Glassmorphism** cho controls overlay — hiện đại, không che quá nhiều video
- **Touch-friendly** — nút bấm tối thiểu 44x44px, khoảng cách hợp lý
- **Auto-hide controls** — controls ẩn sau 3s không tương tác, tap để hiện lại
- **Bottom sheet** thay vì modal trên mobile — dễ thao tác 1 tay
- **Haptic feedback** (nếu hỗ trợ) cho các nút timing adjustment

### 6.2 Responsive Breakpoints

| Breakpoint | Kích thước | Layout |
|:---|:---|:---|
| **Mobile** | < 640px | 1 cột, bottom controls, full-width player |
| **Tablet** | 640px - 1024px | 2-3 cột grid, side panel subtitle |
| **Desktop** | > 1024px | Multi-column grid, floating controls |

### 6.3 Màn Hình Chính

#### A. Home / File Browser
```
┌────────────────────────┐
│  🎬 AnimePlayerLocal   │ ← Header với search
│  [🔍 Tìm kiếm...]     │
├────────────────────────┤
│  📁 Psycho-Pass        │ ← Nhóm theo folder
│  ┌──────┐ ┌──────┐     │
│  │ Ep01 │ │ Ep02 │     │ ← Video cards
│  │ 24m  │ │ 24m  │     │
│  └──────┘ └──────┘     │
│  ┌──────┐ ┌──────┐     │
│  │ Ep03 │ │ Ep04 │     │
│  └──────┘ └──────┘     │
│                         │
│  📁 Attack on Titan     │
│  ┌──────┐ ┌──────┐     │
│  │ Ep01 │ │ Ep02 │     │
│  └──────┘ └──────┘     │
└────────────────────────┘
```

#### B. Video Player (Mobile - Portrait)
```
┌────────────────────────┐
│ ← Back    Ep01    ⚙️   │ ← Top bar
├────────────────────────┤
│                         │
│    ┌──────────────┐     │
│    │              │     │
│    │  VIDEO AREA  │     │ ← 16:9 ratio
│    │              │     │
│    │    advancement│     │
│    │     advancement│    │
│    └──────────────┘     │
│ ▶ ━━━━━●━━━━━━━ 12:34  │ ← Seek bar
├────────────────────────┤
│                         │
│  Subtitle Settings      │ ← Subtitle panel
│  ┌──────────────────┐   │
│  │ Track: Viet ▼    │   │
│  │ [Off] [On]       │   │
│  │                  │   │
│  │ Timing: +0.0s    │   │
│  │ [-1s][-0.5][-0.1]│   │
│  │ [+0.1][+0.5][+1s]│   │
│  │ [Reset]          │   │
│  │                  │   │
│  │ [+ Add Subtitle] │   │
│  └──────────────────┘   │
└────────────────────────┘
```

#### C. Video Player (Mobile - Landscape / Fullscreen)
```
┌──────────────────────────────────────────┐
│ ← Back              Ep01           ⚙️ ✕  │ ← Auto-hide
│                                           │
│                                           │
│              VIDEO FULL AREA              │
│                                           │
│         「Subtitle text here」             │
│                                           │
│   advancement         ▶  ⏭  🔊  🎵  CC  ⚙️ │ ← Bottom controls (🎵 = audio track)
│  ━━━━━━━●━━━━━━━━━━━━  12:34 / 24:00       │
└──────────────────────────────────────────┘

CC button → Opens bottom sheet:
┌──────────────────────────────────────────┐
│  Subtitle                          ✕     │
│  ─────────────────────────────────────   │
│  ● Vietnamese (ASS) — Embedded           │
│  ○ English (SRT) — Embedded              │
│  ○ [Uploaded] MySub.srt                  │
│  ○ Off                                   │
│  ─────────────────────────────────────   │
│  Timing: [-1s][-0.5][-0.1] +0.0 [+0.1][+0.5][+1s] │
│  ─────────────────────────────────────   │
│  [+ Add Subtitle File]                   │
└──────────────────────────────────────────┘
```

### 6.4 Color Palette

```css
/* Dark Theme — Anime-inspired */
--bg-primary:     hsl(230, 25%, 8%);      /* Nền chính — gần đen xanh */
--bg-secondary:   hsl(230, 20%, 12%);     /* Card, panel */
--bg-surface:     hsl(230, 18%, 16%);     /* Controls, input */
--bg-glass:       hsla(230, 25%, 15%, 0.7); /* Glassmorphism overlay */

--text-primary:   hsl(220, 20%, 95%);     /* Text chính */
--text-secondary: hsl(220, 15%, 60%);     /* Text phụ */
--text-muted:     hsl(220, 10%, 40%);     /* Text mờ */

--accent-primary: hsl(265, 85%, 65%);     /* Tím — accent chính */
--accent-hover:   hsl(265, 85%, 75%);     /* Hover state */
--accent-glow:    hsla(265, 85%, 65%, 0.3); /* Glow effect */

--success:        hsl(160, 70%, 45%);     /* Xanh lá */
--warning:        hsl(40, 90%, 55%);      /* Vàng cam */
--error:          hsl(0, 75%, 60%);       /* Đỏ */

--border:         hsl(230, 15%, 20%);     /* Viền */
--border-focus:   hsl(265, 85%, 65%);     /* Focus ring */
```

---

## 7. Chiến Lược TDD

### 7.1 Quy Trình Red-Green-Refactor

```
┌─────────┐     ┌─────────┐     ┌───────────┐
│  🔴 RED  │────▶│ 🟢 GREEN│────▶│ 🔵 REFACTOR│
│  Write   │     │  Write  │     │  Improve   │
│  failing │     │  minimal│     │  code      │
│  test    │     │  code   │     │  quality   │
└─────────┘     └─────────┘     └───────────┘
      ▲                               │
      └───────────────────────────────┘
```

### 7.2 Phân Loại Test

| Loại | Tỷ lệ | Công cụ | Mô tả |
|:---|:---|:---|:---|
| **Unit Test** | ~60% | Vitest | Test hàm thuần túy, parser, utils |
| **Component Test** | ~25% | Vitest + RTL | Test React components, hooks |
| **Integration Test** | ~10% | Supertest + Vitest | Test API endpoints, service layers |
| **E2E Test** | ~5% | Playwright (optional) | Test toàn luồng |

### 7.3 Test Cases Chính

#### Backend Tests

```
📦 Server Tests
├── fileScanner.test.ts
│   ├── ✅ should scan directory and return video files
│   ├── ✅ should filter only .mkv and .mp4 files
│   ├── ✅ should scan recursively in subdirectories
│   ├── ✅ should return file metadata (name, size, path)
│   ├── ✅ should handle empty directory
│   └── ✅ should handle non-existent directory gracefully
│
├── subtitleScanner.test.ts
│   ├── ✅ should scan subtitle directory for .ass/.srt/.vtt files
│   ├── ✅ should match subtitle files to video by name
│   ├── ✅ should detect language from filename (EP01.vie.srt → "vie")
│   ├── ✅ should handle subtitle dir not existing gracefully
│   └── ✅ should auto-detect file encoding
│
├── subtitleExtractor.test.ts
│   ├── ✅ should detect embedded subtitle tracks via FFprobe
│   ├── ✅ should detect embedded audio tracks via FFprobe
│   ├── ✅ should return subtitle track info (index, lang, codec)
│   ├── ✅ should return audio track info (index, lang, codec)
│   ├── ✅ should extract specific subtitle track to text
│   ├── ✅ should handle video with no subtitles
│   ├── ✅ should cache extracted subtitles
│   └── ✅ should handle extraction errors gracefully
│
├── videoStreamer.test.ts
│   ├── ✅ should stream video with range headers
│   ├── ✅ should return 206 Partial Content
│   ├── ✅ should return correct Content-Range header
│   ├── ✅ should handle invalid range requests
│   └── ✅ should return 404 for non-existent files
│
├── videoRoutes.test.ts
│   ├── ✅ GET /api/videos — should return video list
│   ├── ✅ GET /api/videos/:id/stream — should stream video
│   ├── ✅ GET /api/videos/:id/subtitles — should return subtitle tracks
│   ├── ✅ GET /api/videos/:id/subtitles/:trackId — should return subtitle content
│   ├── ✅ GET /api/videos/:id/audio-tracks — should return audio track list
│   └── ✅ GET /api/videos/:id/external-subs — should return external subtitle list
│
├── subtitleRoutes.test.ts
│   ├── ✅ GET /api/videos/:id/external-subs/:filename — should return subtitle content
│   └── ✅ GET /api/browse-subs — should browse subtitle directory
│
└── networkInfo.test.ts
    ├── ✅ should return LAN IP address
    └── ✅ should generate QR code with server URL
```

#### Frontend Tests

```
📦 Client Tests
├── subtitleParser.test.ts
│   ├── ✅ should parse SRT format correctly
│   ├── ✅ should parse VTT format correctly
│   ├── ✅ should parse ASS format correctly
│   ├── ✅ should handle malformed subtitle gracefully
│   ├── ✅ should apply timing offset to all cues
│   ├── ✅ should apply positive offset (+0.5s)
│   ├── ✅ should apply negative offset (-0.1s)
│   └── ✅ should not create negative timestamps
│
├── useSubtitleTiming.test.ts
│   ├── ✅ should initialize with offset 0
│   ├── ✅ should increase offset by 0.1s
│   ├── ✅ should increase offset by 0.5s
│   ├── ✅ should increase offset by 1s
│   ├── ✅ should decrease offset by 0.1s, 0.5s, 1s
│   ├── ✅ should reset offset to 0
│   └── ✅ should persist offset per video+subtitle pair
│
├── SubtitleTimingControl.test.tsx
│   ├── ✅ should render 6 adjustment buttons + reset
│   ├── ✅ should display current offset
│   ├── ✅ should call onAdjust with correct delta on click
│   ├── ✅ should call onReset when reset button clicked
│   └── ✅ should be accessible (aria labels)
│
├── SubtitleTrackSelector.test.tsx
│   ├── ✅ should render list of embedded subtitle tracks
│   ├── ✅ should render list of external subtitle files
│   ├── ✅ should highlight currently active track
│   ├── ✅ should include "Off" option
│   ├── ✅ should call onSelect when track chosen
│   └── ✅ should show external subtitle browse button
│
├── FileBrowser.test.tsx
│   ├── ✅ should render video cards from API data
│   ├── ✅ should filter videos by search query
│   ├── ✅ should group videos by directory
│   ├── ✅ should show loading state
│   ├── ✅ should show error state
│   └── ✅ should navigate to player on video click
│
├── VideoPlayer.test.tsx
│   ├── ✅ should render video element with correct source
│   ├── ✅ should show/hide controls on interaction
│   ├── ✅ should toggle play/pause
│   ├── ✅ should display current time and duration
│   └── ✅ should enter/exit fullscreen
│
├── VideoControls.test.tsx
│   ├── ✅ should render all control buttons
│   ├── ✅ should show subtitle CC button
│   ├── ✅ should show audio track button
│   ├── ✅ should open subtitle panel on CC click
│   ├── ✅ should open audio track selector
│   └── ✅ should be touch-friendly (min 44px tap target)
│
└── AudioTrackSelector.test.tsx
    ├── ✅ should render list of available audio tracks
    ├── ✅ should highlight currently active audio track
    └── ✅ should call onSelect when audio track chosen
```

### 7.4 Coverage Target

| Metric | Target |
|:---|:---|
| **Line Coverage** | ≥ 80% |
| **Branch Coverage** | ≥ 75% |
| **Function Coverage** | ≥ 85% |

---

## 8. Phân Pha Thực Hiện

### Phase 0: Project Setup (Ước tính: 1-2 giờ)

- [ ] Khởi tạo monorepo structure
- [ ] Setup Vite + React + TypeScript (client)
- [ ] Setup Node.js + Express + TypeScript (server)
- [ ] Cấu hình Vitest cho cả client và server
- [ ] Setup CSS design system (variables, reset, global)
- [ ] Cấu hình ESLint + Prettier
- [ ] Setup concurrent dev scripts (client + server chạy đồng thời)

**Deliverable:** Project chạy được `npm run dev`, test runner hoạt động.

---

### Phase 1: Backend — File Scanner & Video Streaming (Ước tính: 3-4 giờ)

**TDD Flow:**
1. Viết test cho `fileScanner` → implement
2. Viết test cho `videoStreamer` → implement
3. Viết test cho routes → implement
4. Integration test

- [ ] `fileScanner` service — scan thư mục, trả về danh sách video
- [ ] `videoStreamer` service — HTTP range request streaming
- [ ] `GET /api/videos` route
- [ ] `GET /api/videos/:id/stream` route
- [ ] Config system (đường dẫn thư mục video + subtitle via `.env`/`config.json`)
- [ ] Network info service — hiển thị LAN IP + QR code khi start server

**Deliverable:** API server trả về danh sách video, stream được video qua HTTP.

---

### Phase 2: Frontend — File Browser & Basic Player (Ước tính: 4-5 giờ)

**TDD Flow:**
1. Viết test cho API service → implement
2. Viết test cho FileBrowser → implement
3. Viết test cho VideoPlayer → implement

- [ ] API client service
- [ ] FileBrowser component — grid layout, search
- [ ] VideoCard component — hiển thị thông tin video
- [ ] VideoPlayer component — HTML5 video + custom controls
- [ ] VideoControls component — play, pause, seek, volume, fullscreen
- [ ] Routing (Home ↔ Player)
- [ ] Mobile-first CSS, dark theme
- [ ] Touch gestures (double-tap skip, swipe volume)

**Deliverable:** Có thể duyệt video và xem trên mobile browser.

---

### Phase 3: Backend — Subtitle Extraction (Ước tính: 2-3 giờ)

**TDD Flow:**
1. Viết test cho `subtitleExtractor` → implement
2. Viết test cho subtitle routes → implement

- [ ] `subtitleExtractor` service — FFprobe detect embedded subs + audio tracks + FFmpeg extract
- [ ] `subtitleScanner` service — scan thư mục subtitle riêng, matching với video
- [ ] `GET /api/videos/:id/subtitles` — liệt kê embedded tracks
- [ ] `GET /api/videos/:id/subtitles/:trackId` — extract & trả content
- [ ] `GET /api/videos/:id/external-subs` — liệt kê file subtitle từ thư mục riêng
- [ ] `GET /api/videos/:id/external-subs/:filename` — đọc file subtitle
- [ ] `GET /api/videos/:id/audio-tracks` — liệt kê audio tracks
- [ ] `GET /api/browse-subs` — browse thư mục subtitle trên PC
- [ ] Cache layer cho extracted subtitles
- [ ] Error handling cho video không có subtitle

**Deliverable:** API extract được subtitle từ MKV/MP4.

---

### Phase 4: Frontend — Subtitle Rendering (Ước tính: 4-5 giờ)

**TDD Flow:**
1. Viết test cho subtitleParser → implement
2. Viết test cho SubtitleTrackSelector → implement
3. Viết test cho JASSUB integration → implement

- [ ] `subtitleParser` utility — parse SRT, VTT, ASS
- [ ] Tích hợp JASSUB (full libass WASM) — render ASS subtitle lên canvas overlay
- [ ] Cấu hình COOP/COEP headers trên server cho JASSUB multi-threading
- [ ] SRT/VTT rendering — native `<track>` element hoặc custom
- [ ] SubtitleTrackSelector component — chọn embedded + external tracks
- [ ] SubtitleManager component — tổng hợp UI subtitle
- [ ] External subtitle browser — browse thư mục subtitle từ điện thoại
- [ ] AudioTrackSelector component — chọn audio track

**Deliverable:** Subtitle embedded, external từ thư mục riêng, và audio track selection đều hoạt động.

---

### Phase 5: Subtitle Timing Adjustment (Ước tính: 2-3 giờ)

**TDD Flow:**
1. Viết test cho `useSubtitleTiming` hook → implement
2. Viết test cho `SubtitleTimingControl` component → implement
3. Integration test timing + rendering

- [ ] `useSubtitleTiming` hook — quản lý offset state
- [ ] `SubtitleTimingControl` component — 6 nút điều chỉnh + reset
- [ ] Áp dụng offset vào subtitle rendering (SRT/VTT)
- [ ] Áp dụng offset vào JASSUB (ASS)
- [ ] Persist offset per video+subtitle pair (localStorage)
- [ ] UI polish — animation cho thay đổi offset

**Deliverable:** Điều chỉnh timing subtitle hoạt động real-time.

---

### Phase 6: PWA, Polish & Optimization (Ước tính: 3-4 giờ)

- [ ] PWA setup — manifest, service worker, installable từ home screen
- [ ] QR Code — server hiển thị QR code trên console + web UI cho PC
- [ ] Performance optimization — lazy loading, code splitting
- [ ] Animation polish — micro-animations, transitions
- [ ] Error boundaries và error states
- [ ] Loading states và skeletons
- [ ] Keyboard shortcuts
- [ ] Resume playback (localStorage)
- [ ] Connection status — hiển thị trạng thái kết nối server, auto-reconnect
- [ ] Responsive testing trên nhiều kích thước mobile
- [ ] Accessibility review (ARIA labels, focus management)
- [ ] README.md documentation

**Deliverable:** App hoàn thiện, PWA installable, sẵn sàng sử dụng.

---

## 9. API Design

### Endpoints

```
── VIDEO ──────────────────────────────────────────────────────

GET    /api/videos
       → Response: { videos: Video[] }
       → Trả về danh sách tất cả video trong thư mục trên PC

GET    /api/videos/:id/info
       → Response: { video: VideoDetail }
       → Trả về thông tin chi tiết (duration, resolution, subtitle tracks)

GET    /api/videos/:id/stream
       → Headers: Range: bytes=0-
       → Response: 206 Partial Content (video stream qua WiFi)
       → Stream video từ PC qua HTTP range request

── EMBEDDED SUBTITLE ──────────────────────────────────────────

GET    /api/videos/:id/subtitles
       → Response: { embedded: SubtitleTrack[], external: ExternalSubtitleFile[] }
       → Liệt kê cả subtitle embedded + file subtitle ngoài trên PC

GET    /api/videos/:id/subtitles/:trackIndex
       → Response: { content: string, format: string }
       → Extract embedded subtitle track từ video bằng FFmpeg

── EXTERNAL SUBTITLE (file trên PC) ───────────────────────────

GET    /api/videos/:id/external-subs
       → Response: { files: ExternalSubtitleFile[] }
       → Liệt kê file subtitle (.ass/.srt/.vtt) cùng thư mục video trên PC

GET    /api/videos/:id/external-subs/:filename
       → Response: { content: string, format: string }
       → Đọc nội dung file subtitle từ PC, auto-detect encoding

GET    /api/browse-subs?dir=E:\Subtitles
       → Response: { files: ExternalSubtitleFile[] }
       → Browse thư mục subtitle khác trên PC (cho trường hợp sub nằm ngoài thư mục video)

── CONFIG & NETWORK ───────────────────────────────────────────

GET    /api/config
       → Response: { videoDir: string, subtitleDirs: string[], serverIP: string, port: number }
       → Trả về cấu hình hiện tại + IP LAN để hiển thị

GET    /api/network
       → Response: { ip: string, port: number, url: string, qrCode?: string }
       → Trả về thông tin mạng LAN để điện thoại kết nối
```

### Data Types

```typescript
interface Video {
  id: string;              // Hash hoặc base64 encode đường dẫn
  name: string;            // Tên file
  path: string;            // Relative path từ video dir (KHÔNG gửi absolute path ra client)
  size: number;            // Bytes
  duration?: number;       // Seconds (từ FFprobe)
  resolution?: string;     // "1920x1080"
  group?: string;          // Tên thư mục cha (series name)
  modifiedAt: string;      // ISO date
  subtitleTrackCount: number;        // Embedded subtitle tracks
  audioTrackCount: number;           // Audio tracks trong video
  externalSubtitleCount: number;     // File subtitle ngoài tìm thấy từ subtitle dir
}

// Subtitle track nhúng trong video (embedded/soft sub)
interface SubtitleTrack {
  index: number;           // Stream index trong video
  language?: string;       // "vie", "eng", "jpn"
  title?: string;          // Tên track
  codec: string;           // "ass", "srt", "subrip"
  isDefault: boolean;
  isForced: boolean;
  source: 'embedded';      // Đánh dấu nguồn
}

// File subtitle nằm trên PC trong thư mục riêng (external)
interface ExternalSubtitleFile {
  filename: string;        // "EP01.vie.ass"
  format: string;          // "ass", "srt", "vtt"
  language?: string;       // Detect từ tên file nếu có (EP01.vie.ass → "vie")
  size: number;            // Bytes
  isAutoMatched: boolean;  // true nếu tên matching với video (EP01.mkv ↔ EP01.*.ass)
  source: 'external';      // Đánh dấu nguồn
}

// Audio track trong video
interface AudioTrack {
  index: number;           // Stream index trong video
  language?: string;       // "jpn", "eng"
  title?: string;          // "Japanese", "English 5.1"
  codec: string;           // "aac", "flac", "opus"
  channels?: number;       // 2 (stereo), 6 (5.1)
  isDefault: boolean;
}

interface SubtitleCue {
  startTime: number;       // Seconds
  endTime: number;         // Seconds
  text: string;            // Nội dung subtitle
  style?: object;          // ASS styling info (optional)
}
```

---

## 10. Quyết Định Thiết Kế (Đã Xác Nhận)

Tất cả quyết định thiết kế đã được xác nhận. Dưới đây là tổng hợp:

### 📐 Kiến Trúc & Cấu Hình

| Quyết định | Lựa chọn | Chi tiết |
|:---|:---|:---|
| **Cấu trúc dự án** | ✅ Monorepo | `client/` + `server/` riêng `package.json` |
| **Đường dẫn video** | ✅ Không hardcode | Cấu hình qua `.env`/`config.json` + thay đổi được từ UI điện thoại |
| **Đường dẫn subtitle** | ✅ Thư mục riêng | Subtitle nằm trong thư mục riêng biệt với video, cấu hình tương tự |
| **Cách cấu hình** | ✅ Config + UI (D) | Mặc định từ `.env`/`config.json`, có thể thay đổi từ settings page trên điện thoại |

### 🎬 Video Player

| Quyết định | Lựa chọn | Chi tiết |
|:---|:---|:---|
| **MKV compatibility** | ✅ Gửi trực tiếp (B) | Chrome/Edge mobile hiện đại hỗ trợ MKV, không cần remux |
| **Thumbnail** | ✅ Không generate (B) | Dùng placeholder icon / text-only cards |
| **Video size limit** | ✅ Không giới hạn (A) | HTTP Range Request streaming, không cần giới hạn file size |
| **Tính năng bổ sung** | ✅ Audio track selection | Cho phép chọn audio track (JPN/ENG/...) khi video có nhiều audio |

### 🎨 Frontend

| Quyết định | Lựa chọn | Chi tiết |
|:---|:---|:---|
| **State Management** | ✅ Zustand (A) | Nhẹ (~1KB), persist middleware, API đơn giản |
| **ASS Subtitle** | ✅ JASSUB full (A) | libass WASM, 100% tương thích, WebGL rendering, cần COOP/COEP headers |
| **Ngôn ngữ UI** | ✅ Tiếng Anh (B) | Toàn bộ giao diện bằng tiếng Anh |

### 📱 Trải Nghiệm Mobile

| Quyết định | Lựa chọn | Chi tiết |
|:---|:---|:---|
| **PWA** | ✅ PWA + QR Code (C) | Installable từ home screen + QR code trên PC để scan nhanh |

### 📝 Tóm tắt cấu trúc thư mục trên PC

```
💻 Máy tính (Server)

📂 VIDEO_DIR (cấu hình, ví dụ: E:\Anime\)
   ├── Psycho-Pass\
   │   ├── EP01.mkv
   │   └── EP02.mkv
   └── Attack-on-Titan\
       ├── EP01.mp4
       └── EP02.mp4

📂 SUBTITLE_DIR (cấu hình, ví dụ: E:\Subtitles\)
   ├── Psycho-Pass\
   │   ├── EP01.ass
   │   ├── EP01.vie.srt
   │   └── EP01.eng.ass
   └── Attack-on-Titan\
       ├── EP01.srt
       └── EP01.vie.ass

⚙️ config.json hoặc .env:
   VIDEO_DIR=E:\Anime
   SUBTITLE_DIR=E:\Subtitles
   PORT=3000
```

---

## 11. Rủi Ro & Giải Pháp

| Rủi ro | Mức độ | Giải pháp |
|:---|:---|:---|
| MKV không chạy trên một số trình duyệt mobile (Safari) | 🟡 Trung bình | Khuyến nghị dùng Chrome/Edge; có thể thêm remux fallback sau |
| JASSUB WASM load chậm / nặng trên mobile (~3-4MB) | 🟡 Trung bình | Lazy load, preload khi chọn video, cache WASM |
| FFmpeg không cài sẵn trên PC | 🔴 Cao | Check lúc start, hiển thị hướng dẫn cài đặt rõ ràng |
| WiFi bandwidth không đủ stream video HD/Blu-ray | 🟡 Trung bình | Dùng WiFi 5GHz, Range Request chỉ load phần cần |
| Điện thoại không kết nối được server | 🟡 Trung bình | QR code + hiển thị IP rõ ràng, kiểm tra firewall |
| Windows Firewall chặn port 3000 | 🟡 Trung bình | Auto-detect + hướng dẫn mở port, hoặc script tự mở |
| CORS issues khi truy cập từ IP khác | 🟢 Thấp | CORS cho phép tất cả private network IPs |
| File subtitle encoding sai (Shift-JIS, GB2312) | 🟡 Trung bình | Auto-detect encoding (chardet) trên server |
| Subtitle và video nằm khác thư mục, matching sai | 🟡 Trung bình | Matching bằng tên file gốc + cho phép browse manual |
| COOP/COEP headers conflict với resources khác | 🟢 Thấp | Cấu hình headers chỉ cho route cần JASSUB |
| PC sleep/tắt trong khi đang xem | 🟢 Thấp | Client hiển thị trạng thái kết nối, auto-reconnect |

---

## Tổng Kết

| Metric | Giá trị |
|:---|:---|
| **Tổng thời gian ước tính** | 20-28 giờ |
| **Số phases** | 7 (Phase 0-6) |
| **Số test cases dự kiến** | ~65-75 test |
| **Dependencies chính** | React 19, Zustand, Express, FFmpeg, JASSUB, vite-plugin-pwa |
| **Ưu tiên #1** | Mobile video player + subtitle (embedded + external) + audio track |
| **Ngôn ngữ UI** | Tiếng Anh |
| **PWA** | Có (installable + QR code) |

### Danh sách tính năng hoàn chỉnh

| # | Tính năng | Phase |
|:---|:---|:---|
| 1 | File browser — duyệt video từ thư mục PC (placeholder icons, không thumbnail) | Phase 1-2 |
| 2 | Video streaming — MKV/MP4 qua HTTP Range Request, gửi trực tiếp | Phase 1-2 |
| 3 | Embedded subtitle — detect, extract, render (JASSUB cho ASS) | Phase 3-4 |
| 4 | External subtitle — scan thư mục riêng, matching, browse từ điện thoại | Phase 3-4 |
| 5 | Subtitle timing adjustment — ±0.1s, ±0.5s, ±1s real-time | Phase 5 |
| 6 | Audio track selection — chọn audio track khi video có nhiều tracks | Phase 3-4 |
| 7 | PWA + QR Code — installable, QR code scan để kết nối | Phase 6 |
| 8 | Mobile-optimized UI — dark theme, glassmorphism, touch gestures | Phase 2, 6 |
| 9 | Settings page — cấu hình thư mục video/subtitle từ điện thoại | Phase 1, 6 |

---

> 📌 **Tất cả quyết định đã được xác nhận. Sẵn sàng bắt đầu implement Phase 0!**
