# 🚀 Detailed Implementation Plan — AnimePlayerLocal

Dự án phát triển ứng dụng **AnimePlayerLocal** tuân thủ triệt để nguyên tắc **TDD (Test-Driven Development)**, xây dựng song song Frontend (React + Zustand) và Backend (Node.js + Express) dưới dạng cấu trúc **Monorepo**.

Dưới đây là kế hoạch hiện thực hóa (implementation plan) chi tiết từng bước cho từng pha (Phase 0 đến Phase 6), bao gồm cả các task viết test (Red) và code tương ứng (Green).

---

## 📋 Trạng thái tổng quát của các Phase
- [x] **Phase 0: Project Setup & Monorepo Initialization** (1-2 giờ)
- [ ] **Phase 1: Backend — File Scanner & Video Streaming** (3-4 giờ)
- [ ] **Phase 2: Frontend — File Browser & Basic Video Player** (4-5 giờ)
- [ ] **Phase 3: Backend — Subtitle Scanner, Extractor & Audio Tracks** (3-4 giờ)
- [ ] **Phase 4: Frontend — Subtitle & Audio Track Selection** (4-5 giờ)
- [ ] **Phase 5: Subtitle Timing Adjustment (Real-time)** (2-3 giờ)
- [ ] **Phase 6: PWA, QR Code, Settings & Final Polish** (3-4 giờ)

---

## 🛠️ CHI TIẾT TỪNG PHASE

### Phase 0: Project Setup & Monorepo Initialization
*Mục tiêu:* Thiết lập nền tảng dự án monorepo với TypeScript, cấu hình chạy thử nghiệm dev environment, setup test runner (Vitest) cho cả client và server.

#### Task 0.1: Cấu trúc Monorepo & Root Configuration
- [x] Khởi tạo thư mục gốc `AnimePlayerLocal`
- [x] Tạo file `package.json` ở root cấu hình npm workspaces:
  ```json
  {
    "name": "anime-player-local",
    "private": true,
    "workspaces": [
      "client",
      "server"
    ],
    "scripts": {
      "dev": "concurrently \"npm run dev --w client\" \"npm run dev --w server\"",
      "test": "npm run test --workspaces"
    }
  }
  ```
- [x] Cài đặt các devDependencies chung: `concurrently`, `typescript`, `eslint`, `prettier`.

#### Task 0.2: Setup Backend (Server)
- [x] Tạo thư mục `server/` và khởi tạo `server/package.json` với các package: `express`, `cors`, `dotenv`, `zod`, `chokidar`, `fluent-ffmpeg`.
- [x] Setup `tsconfig.json` cho server hỗ trợ Node.js & TypeScript ESNext.
- [x] Setup `vitest.config.ts` cho server với coverage provider `v8`.
- [x] Viết một test kiểm thử Express server cơ bản để kiểm tra test runner chạy đúng.

#### Task 0.3: Setup Frontend (Client)
- [x] Khởi tạo dự án React + TypeScript trong `client/` sử dụng Vite: `npx -y create-vite@latest client --template react-ts`.
- [x] Cài đặt các thư viện: `zustand`, `lucide-react`, `jassub` (libass WASM).
- [x] Setup `vitest.config.ts` cho client cùng với `@testing-library/react`, `@testing-library/jest-dom`, và `jsdom`.
- [x] Cài đặt `vite-plugin-pwa` để hỗ trợ PWA sau này.

#### Task 0.4: CSS Design System
- [x] Thiết lập file CSS biến môi trường màu sắc & theme tối: `client/src/styles/variables.css` (Dark theme, Tím làm màu chủ đạo).
- [x] Cấu hình reset styles `client/src/styles/reset.css`.
- [x] Import các file style vào `client/src/main.tsx`.

---

### Phase 1: Backend — File Scanner & Video Streaming
*Mục tiêu:* Quét thư mục video local cấu hình động, hỗ trợ HTTP Range Request để stream video mượt mà lên điện thoại.

#### Task 1.1: Config Service & Dynamic Path settings
- [ ] **[RED]** Viết unit test cho `config.test.ts` đảm bảo:
  - Đọc cấu hình từ `.env` hoặc file `config.json` mặc định.
  - Lưu và cập nhật được thư mục video và subtitle động.
- [ ] **[GREEN]** Tạo `server/src/config/index.ts` xử lý lưu trữ cấu hình động dưới local file của server.

#### Task 1.2: File Scanner Service
- [ ] **[RED]** Viết test cho `fileScanner.test.ts` kiểm thử:
  - `scanDirectory()` quét ra danh sách các video `.mkv`, `.mp4`.
  - Hỗ trợ quét đệ quy thư mục con.
  - Trả thông tin cơ bản: tên file, relative path, size.
  - Xử lý thư mục trống hoặc không tồn tại mà không làm sập ứng dụng.
- [ ] **[GREEN]** Hiện thực hóa `server/src/services/fileScanner.ts` sử dụng `fs.promises` để đọc file.

#### Task 1.3: Video Streaming Service (HTTP Range Request)
- [ ] **[RED]** Viết test cho `videoStreamer.test.ts`:
  - Request không có Range header → Trả về code 200 và toàn bộ file.
  - Request có Range header `bytes=0-100` → Trả về code 206, `Content-Range` header tương ứng, và đúng 101 bytes content.
  - Trả về code 404 nếu file không tồn tại.
- [ ] **[GREEN]** Hiện thực hóa `server/src/services/videoStreamer.ts` xử lý luồng đọc file bằng `fs.createReadStream()`.

#### Task 1.4: Video Router & API Endpoints
- [ ] **[RED]** Viết Integration test sử dụng `supertest` cho:
  - `GET /api/videos` → Danh sách video (JSON).
  - `GET /api/videos/:id/stream` → Stream dữ liệu.
- [ ] **[GREEN]** Tạo các route `server/src/routes/videoRoutes.ts` và tích hợp vào Express app.

---

### Phase 2: Frontend — File Browser & Basic Video Player
*Mục tiêu:* Thiết kế giao diện duyệt thư mục, danh sách phim trên mobile browser, và trình phát video cơ bản bằng HTML5.

#### Task 2.1: Zustand Store Setup
- [ ] **[RED]** Viết unit test cho `playerStore.test.ts` quản lý state:
  - Danh sách video.
  - Video đang được chọn phát.
  - Lịch sử xem (vị trí hiện tại).
  - Config đường dẫn.
- [ ] **[GREEN]** Tạo `client/src/store/playerStore.ts` sử dụng Zustand và middleware `persist` lưu vào LocalStorage.

#### Task 2.2: Components Duyệt Video (File Browser)
- [ ] **[RED]** Viết component test cho `FileBrowser.test.tsx` và `VideoCard.test.tsx`:
  - Hiển thị danh sách video nhận từ API.
  - Nhóm các video theo thư mục con (series).
  - Tìm kiếm video theo tên.
  - Click vào video kích hoạt sự kiện chọn phim để xem.
- [ ] **[GREEN]** Thiết kế giao diện mobile-first cho `FileBrowser` (layout 1-2 cột trên điện thoại).

#### Task 2.3: Video Player Custom HTML5
- [ ] **[RED]** Viết component test cho `VideoPlayer.test.tsx` spaying các hàm `play()`, `pause()` của HTMLMediaElement. Kiểm thử:
  - Video có thuộc tính `src` hướng tới route stream của server.
  - Hiện/Ẩn custom control bar khi tap màn hình.
  - Click nút Play/Pause thay đổi trạng thái phát video.
  - Thanh tiến trình (seek bar) cập nhật thời gian phát hiện tại.
- [ ] **[GREEN]** Hiện thực `VideoPlayer` sử dụng thẻ `<video>` HTML5 gốc, gán ref để tự custom lại toàn bộ UI điều khiển cho đẹp mắt và to rõ, phù hợp với ngón tay trên điện thoại.
- [ ] Thêm cử chỉ vuốt (Gesture) trên mobile:
  - Double tap vùng trái/phải để tua lùi/tới 10s.
  - Vuốt dọc bên phải tăng giảm âm lượng.

---

### Phase 3: Backend — Subtitle Scanner, Extractor & Audio Tracks
*Mục tiêu:* Dùng FFmpeg/FFprobe trên PC server để phân tích và trích xuất subtitle tracks, audio tracks nhúng trong file video, đồng thời quét thư mục subtitle ngoài.

#### Task 3.1: Embedded Subtitles & Audio Detector
- [ ] **[RED]** Viết unit test cho `subtitleExtractor.test.ts` (mock dữ liệu FFprobe):
  - Phân tích video và trả về danh sách stream subtitle (index, language, codec: ASS/SRT).
  - Phân tích video và trả về danh sách stream audio (index, language, codec).
- [ ] **[GREEN]** Viết `server/src/services/subtitleExtractor.ts` sử dụng `fluent-ffmpeg` gọi `ffprobe` trích xuất thông tin audio và subtitle.

#### Task 3.2: Subtitle Extractor
- [ ] **[RED]** Viết unit test cho `subtitleExtractor.test.ts` phần extract:
  - Trích xuất subtitle track chỉ định sang dạng SRT/ASS.
  - Trả về dữ liệu thô (text) từ API stream.
  - Lưu cache file sub đã extract trong thư mục tạm `server/temp/` để tránh chạy lại FFmpeg nhiều lần.
- [ ] **[GREEN]** Implement hàm extract sub sử dụng FFmpeg command line (`-map 0:s:index`).

#### Task 3.3: External Subtitles Scanner
- [ ] **[RED]** Viết test cho `subtitleScanner.test.ts`:
  - Quét thư mục `SUBTITLE_DIR` cấu hình.
  - Matching tự động file phụ đề `.ass`, `.srt`, `.vtt` trùng tên (một phần hoặc toàn bộ) với tên video file.
  - Auto-detect encoding của file sub (đảm bảo hiển thị đúng font tiếng Việt, không lỗi utf-8).
- [ ] **[GREEN]** Xây dựng `server/src/services/subtitleScanner.ts`. Sử dụng thư viện detection charset (ví dụ: `jschardet`) để parse file chính xác.

#### Task 3.4: Subtitle & Audio Endpoints
- [ ] **[RED]** Viết Integration test cho:
  - `GET /api/videos/:id/subtitles` -> Trả về danh sách embedded + external subtitles matching.
  - `GET /api/videos/:id/subtitles/:trackIndex` -> Trả về nội dung subtitle nhúng.
  - `GET /api/videos/:id/audio-tracks` -> Trả về danh sách audio tracks.
  - `GET /api/videos/:id/external-subs/:filename` -> Đọc file phụ đề ngoài chỉ định.
- [ ] **[GREEN]** Hiện thực các Router xử lý API trên server.

---

### Phase 4: Frontend — Subtitle & Audio Track Selection
*Mục tiêu:* Tích hợp thư viện libass WASM (JASSUB) để vẽ sub ASS có hiệu ứng karaoke/typesetting mượt mà, đồng thời hỗ trợ chọn file sub ngoài từ server và chuyển kênh audio.

#### Task 4.1: Subtitle Parser & Hook
- [ ] **[RED]** Viết unit test cho `subtitleParser.test.ts` kiểm tra parse SRT/VTT thành dạng cues có `startTime`, `endTime`, `text` để tiện xử lý timing.
- [ ] **[GREEN]** Tạo bộ parser gọn nhẹ trong `client/src/services/subtitleParser.ts`.

#### Task 4.2: Tích hợp JASSUB (libass WebAssembly)
- [ ] Coppy các file JASSUB Web Worker (`jassub-worker.js`, `jassub-worker.wasm`...) vào thư mục `client/public/jassub-worker/`.
- [ ] **[RED]** Viết test cho component React chứa JASSUB đảm bảo gọi khởi tạo JASSUB khi video mount và giải phóng (destroy) khi unmount.
- [ ] **[GREEN]** Thiết kế Canvas overlay nằm đè lên thẻ `<video>`. Khởi tạo JASSUB trỏ vào canvas và video element để render sub `.ass` chính xác chuẩn gốc.
- [ ] Cấu hình header `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp` trong server Express để bật SharedArrayBuffer nâng cao hiệu năng WASM.

#### Task 4.3: UI Chọn Track (Subtitle & Audio)
- [ ] **[RED]** Viết component test cho `SubtitleTrackSelector.test.tsx` và `AudioTrackSelector.test.tsx` mô phỏng sự kiện click:
  - Hiển thị danh sách các track sub nhúng, sub ngoài matching, và tùy chọn "Off".
  - Click chuyển track sub hoặc track audio sẽ gọi hàm callback tương ứng.
- [ ] **[GREEN]** Thiết kế giao diện **Bottom Sheet** bật lên khi chạm vào icon Settings/Subtitle trên mobile player giúp dễ bấm bằng một tay.
- [ ] Gửi tham số audio stream index lên video element hoặc gọi Web Audio API để chuyển luồng phát audio mượt mà.

---

### Phase 5: Subtitle Timing Adjustment (Real-time)
*Mục tiêu:* Cung cấp chức năng thay đổi độ lệch thời gian (timing offset) của phụ đề trực tiếp trên điện thoại giúp sửa lỗi lệch sub tức thì.

#### Task 5.1: State & Hook useSubtitleTiming
- [ ] **[RED]** Viết unit test cho `useSubtitleTiming.test.ts`:
  - Giá trị offset khởi tạo bằng `0`.
  - Gọi các hàm điều chỉnh cộng/trừ 0.1s, 0.5s, 1.0s hoạt động đúng.
  - Nút `Reset` đưa offset về `0`.
  - Offset được lưu trữ tương ứng với từng cặp (video ID + Subtitle ID) vào LocalStorage.
- [ ] **[GREEN]** Hiện thực React Hook `client/src/hooks/useSubtitleTiming.ts`.

#### Task 5.2: Timing Control Component
- [ ] **[RED]** Viết component test cho `SubtitleTimingControl.test.tsx`:
  - Hiển thị 6 nút bấm (tua lùi và tua đi ở 3 mốc: 0.1s, 0.5s, 1s) cùng nút reset.
  - Hiển thị nhãn thời gian dịch chuyển hiện tại (ví dụ: `+0.3s`, `-1.5s`).
- [ ] **[GREEN]** Thiết kế component UI dạng Touch-friendly (targets tối thiểu 44px) tích hợp trực tiếp vào thanh điều khiển của Video Player hoặc Bottom Sheet phụ đề.

#### Task 5.3: Áp dụng Offset vào Rendering
- [ ] Với Subtitle `.srt/.vtt` text-based: Điều chỉnh thời gian của cues khi load: `startTime = originalStartTime + offset`.
- [ ] Với Subtitle `.ass` (JASSUB): Sử dụng hàm `jassubInstance.setOffset(offset)` để libass tự xử lý vẽ lệch thời gian real-time mà không cần nạp lại file sub.
- [ ] **[RED]** Viết test tích hợp đảm bảo khi thay đổi offset, chữ sub đổi mốc thời gian hiển thị mà không bị giật hình video.

---

### Phase 6: PWA, QR Code, Settings & Final Polish
*Mục tiêu:* Hoàn tất trải nghiệm sử dụng thực tế mạng LAN, cho phép ghim app ngoài màn hình điện thoại, quét QR kết nối nhanh và tùy chỉnh thư mục máy tính.

#### Task 6.1: LAN IP Discovery & QR Code
- [ ] **[RED]** Viết unit test cho `networkInfo.test.ts` kiểm thử hàm quét card mạng nội bộ trả về địa chỉ IP LAN dạng `192.168.x.x` và tạo được chuỗi QR Code hợp lệ.
- [ ] **[GREEN]** Xây dựng `server/src/services/networkInfo.ts`. Dùng thư viện `qrcode` để in mã QR ra Terminal khi server khởi chạy và cung cấp qua API `GET /api/network`.

#### Task 6.2: Settings UI (Cấu hình Thư mục từ điện thoại)
- [ ] **[RED]** Viết test cho màn hình cấu hình settings trên mobile:
  - Input cho nhập / chọn đường dẫn `VIDEO_DIR` và `SUBTITLE_DIR` trên PC.
  - Gửi request lưu lên server thành công.
- [ ] **[GREEN]** Tạo trang Settings trong client để tương tác trực tiếp với API config của server.

#### Task 6.3: Cấu hình PWA (Progressive Web App)
- [ ] Tích hợp `vite-plugin-pwa` trong `vite.config.ts`.
- [ ] Thiết lập file `manifest.webmanifest` chứa các icon hiển thị (192px, 512px) để điện thoại Chrome/Safari có tùy chọn "Add to Home Screen".
- [ ] Đăng ký Service Worker trong `client/src/main.tsx` để cache app shell chạy offline nhanh chóng.

#### Task 6.4: Polish & E2E Validation
- [ ] Kiểm thử responsive trên các màn hình iOS (Safari) và Android (Chrome).
- [ ] Tối ưu CSS loading spinner, skeleton placeholder thay thế cho video cards.
- [ ] Tự động ghi nhớ mốc thời gian xem dở (Resume watching) và tự động phát tập tiếp theo trong danh sách (Auto-play).
- [ ] Hoàn thành viết tài liệu hướng dẫn chạy server trên Windows cùng cách kết nối điện thoại vào file `README.md`.

---

## 📈 Quy chuẩn kiểm thử (TDD Enforcement)
Tất cả các file code logic (`.ts`, `.tsx`) đều phải đi kèm file `.test.ts` hoặc `.test.tsx` tương ứng trong cùng thư mục.
Chạy kiểm thử liên tục trong quá trình code bằng lệnh:
```bash
npm run test
```
Đảm bảo độ bao phủ kiểm thử (Coverage) luôn đạt mục tiêu đề ra:
- **Line Coverage >= 80%**
- **Branch Coverage >= 75%**
- **Function Coverage >= 85%**
