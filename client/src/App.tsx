import { useEffect } from 'react';
import { usePlayerStore } from './store/playerStore.ts';
import { fetchVideos } from './services/api.ts';
import FileBrowser from './components/FileBrowser/FileBrowser.tsx';
import VideoPlayer from './components/VideoPlayer/VideoPlayer.tsx';

function App() {
  const { currentVideo, setVideos } = usePlayerStore();

  useEffect(() => {
    fetchVideos()
      .then(setVideos)
      .catch((err) => console.error('Failed to fetch videos from server', err));
  }, [setVideos]);

  return (
    <div className="app">
      {currentVideo ? <VideoPlayer /> : <FileBrowser />}
    </div>
  );
}

export default App;
