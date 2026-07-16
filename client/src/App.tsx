import { useEffect, useState } from 'react';
import { usePlayerStore } from './store/playerStore.ts';
import { fetchVideos } from './services/api.ts';
import FileBrowser from './components/FileBrowser/FileBrowser.tsx';
import VideoPlayer from './components/VideoPlayer/VideoPlayer.tsx';
import SettingsPanel from './components/Settings/SettingsPanel.tsx';

function App() {
  const { currentVideo, setVideos } = usePlayerStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchVideos()
      .then(setVideos)
      .catch((err) => console.error('Failed to fetch videos from server', err))
      .finally(() => setIsLoading(false));
  }, [setVideos]);

  return (
    <div className="app">
      {currentVideo ? (
        <VideoPlayer />
      ) : isSettingsOpen ? (
        <SettingsPanel onClose={() => setIsSettingsOpen(false)} />
      ) : (
        <FileBrowser onOpenSettings={() => setIsSettingsOpen(true)} isLoading={isLoading} />
      )}
    </div>
  );
}

export default App;
