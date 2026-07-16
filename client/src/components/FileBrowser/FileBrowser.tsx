import { useState } from 'react';
import { usePlayerStore } from '../../store/playerStore.ts';
import VideoCard from './VideoCard.tsx';
import styles from './FileBrowser.module.css';
import { Search, Folder, Settings } from 'lucide-react';
import type { VideoFile } from '../../types/video.ts';
import SkeletonCard from './SkeletonCard.tsx';

interface FileBrowserProps {
  onOpenSettings?: () => void;
  isLoading?: boolean;
}

export default function FileBrowser({ onOpenSettings, isLoading = false }: FileBrowserProps) {
  const { videos, setCurrentVideo } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = videos.filter((video) =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups: Record<string, VideoFile[]> = {};
  for (const video of filteredVideos) {
    const parts = video.relativePath.split('/');
    const groupName = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(video);
  }

  const groupNames = Object.keys(groups).sort((a, b) => {
    if (a === 'Root') return -1;
    if (b === 'Root') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>AnimePlayerLocal</h1>
        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm video..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={styles.settingsButton}
            onClick={onOpenSettings}
            aria-label="Cài đặt"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className={styles.emptyState}>
            Không tìm thấy video nào. Vui lòng kiểm tra lại cấu hình thư mục.
          </div>
        ) : (
          groupNames.map((groupName) => (
            <section key={groupName} className={styles.groupSection}>
              <h2 className={styles.groupTitle}>
                <Folder className={styles.folderIcon} size={20} />
                {groupName}
              </h2>
              <div className={styles.grid}>
                {groups[groupName].map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => setCurrentVideo(video)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
