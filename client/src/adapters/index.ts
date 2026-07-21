import type { PlayerAdapter, Platform } from './types';
import { YouTubeAdapter } from './YouTubeAdapter';
import { RutubeAdapter } from './RutubeAdapter';
import { VKVideoAdapter } from './VKVideoAdapter';
import { DirectVideoAdapter } from './DirectVideoAdapter';

export function createAdapter(platform: Platform): PlayerAdapter | null {
  switch (platform) {
    case 'youtube': return new YouTubeAdapter();
    case 'rutube': return new RutubeAdapter();
    case 'vkvideo': return new VKVideoAdapter();
    case 'direct': return new DirectVideoAdapter();
    default: return null;
  }
}
