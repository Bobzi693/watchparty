export type Platform = 'youtube' | 'rutube' | 'vkvideo' | 'direct' | 'unknown';

export interface PlayerAdapter {
  platform: Platform;
  loadVideo(element: HTMLElement, videoId: string, onReady: () => void): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  destroy(): void;
  setStateChangeHandler(handler: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void): void;
  setTimeUpdateHandler(handler: (time: number) => void): void;
}

export interface PlatformUrlInfo {
  platform: Platform;
  videoId: string;
  url: string;
}

export function detectPlatform(url: string): PlatformUrlInfo {
  const trimmed = url.trim();

  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: 'youtube', videoId: ytMatch[1], url: `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&autoplay=1` };

  const rtMatch = trimmed.match(/rutube\.ru\/(?:video\/|play\/embed\/)([a-f0-9]{32})/);
  if (rtMatch) return { platform: 'rutube', videoId: rtMatch[1], url: `https://rutube.ru/play/embed/${rtMatch[1]}?autoplay=1` };

  const vkMatch = trimmed.match(/vk\.com\/video_ext\.php\?oid=([^&]+)&id=(\d+)/);
  if (vkMatch) return { platform: 'vkvideo', videoId: `${vkMatch[1]}_${vkMatch[2]}`, url: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&autoplay=1&js_api=1` };

  const vkShort = trimmed.match(/vk\.com\/video-?(\d+)_(\d+)/);
  if (vkShort) return { platform: 'vkvideo', videoId: `${vkShort[1]}_${vkShort[2]}`, url: `https://vk.com/video_ext.php?oid=-${vkShort[1]}&id=${vkShort[2]}&autoplay=1&js_api=1` };

  if (trimmed.match(/\.(mp4|webm|ogg)(\?|$)/i) || trimmed.match(/^https?:\/\/.+\/.+\.(mp4|webm|ogg)/i)) {
    return { platform: 'direct', videoId: trimmed, url: trimmed };
  }

  return { platform: 'unknown', videoId: trimmed, url: trimmed };
}
