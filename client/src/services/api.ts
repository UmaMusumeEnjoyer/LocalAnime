import type { VideoFile } from '../types/video.ts';

export async function fetchVideos(): Promise<VideoFile[]> {
  const response = await fetch('/api/videos');
  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`);
  }
  return response.json();
}
