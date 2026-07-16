import { useState, useEffect } from 'react';
import styles from './SettingsPanel.module.css';
import { ArrowLeft, Save, QrCode } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

interface NetworkInfo {
  localIp: string;
  port: number;
  qrCodeDataUrl: string;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [videoDir, setVideoDir] = useState('');
  const [subtitleDir, setSubtitleDir] = useState('');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setVideoDir(data.videoDir || '');
        setSubtitleDir(data.subtitleDir || '');
      })
      .catch((err) => console.error('Failed to load config', err));

    fetch('/api/network')
      .then((res) => res.json())
      .then((data) => {
        setNetworkInfo(data);
      })
      .catch((err) => console.error('Failed to load network info', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoDir, subtitleDir }),
      });

      if (res.ok) {
        setMessage('Đã lưu cấu hình thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi lưu cấu hình.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Lỗi kết nối tới server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onClose} aria-label="Trở lại">
          <ArrowLeft size={24} />
        </button>
        <h2 className={styles.title}>Cài Đặt Hệ Thống</h2>
        <div style={{ width: 44 }} />
      </header>

      <div className={styles.content}>
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="videoDir">Thư mục Video (PC)</label>
            <input
              id="videoDir"
              type="text"
              className={styles.input}
              value={videoDir}
              onChange={(e) => setVideoDir(e.target.value)}
              placeholder="Ví dụ: E:\Animes"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="subtitleDir">Thư mục Phụ đề rời (PC - Tùy chọn)</label>
            <input
              id="subtitleDir"
              type="text"
              className={styles.input}
              value={subtitleDir}
              onChange={(e) => setSubtitleDir(e.target.value)}
              placeholder="Ví dụ: E:\Subtitles (để trống nếu chung thư mục video)"
            />
          </div>

          <button type="submit" className={styles.saveButton} disabled={isSaving}>
            <Save size={20} />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>

          {message && <p className={styles.message}>{message}</p>}
        </form>

        {networkInfo && (
          <div className={styles.qrSection}>
            <h3 className={styles.qrTitle}>
              <QrCode size={20} className={styles.qrIcon} />
              <span>Kết Nối LAN nhanh</span>
            </h3>
            <p className={styles.qrSubtitle}>
              Mở camera hoặc ứng dụng quét mã trên điện thoại để kết nối vào mạng nội bộ:
            </p>
            <div className={styles.qrContainer}>
              <img
                src={networkInfo.qrCodeDataUrl}
                alt="LAN QR Code"
                className={styles.qrImage}
              />
            </div>
            <div className={styles.networkAddress}>
              <code>http://{networkInfo.localIp}:{networkInfo.port}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
