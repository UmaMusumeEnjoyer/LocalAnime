import { useEffect } from 'react';
import { usePlayerStore } from './store/playerStore';
import { fetchVideos } from './services/api';
import FileBrowser from './components/FileBrowser/FileBrowser';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

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
