import { VideoFile } from '../types/video';

export async function fetchVideos(): Promise<VideoFile[]> {
  const response = await fetch('/api/videos');
  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`);
  }
  return response.json();
}
