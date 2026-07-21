import type { Platform, PlayerAdapter } from './types';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export class YouTubeAdapter implements PlayerAdapter {
  platform: Platform = 'youtube';
  private player: any = null;
  private container: HTMLElement | null = null;
  private onStateChange: ((state: 'playing' | 'paused' | 'ended' | 'buffering') => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private loaded = false;
  private pendingVideoId: string | null = null;

  loadVideo(element: HTMLElement, videoId: string, onReady: () => void): void {
    this.container = element;
    this.pendingVideoId = videoId;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const first = document.getElementsByTagName('script')[0];
      first?.parentNode?.insertBefore(tag, first);

      window.onYouTubeIframeAPIReady = () => this.createPlayer(videoId, onReady);
    } else if (!this.loaded) {
      this.createPlayer(videoId, onReady);
    } else {
      this.player.loadVideoById(videoId);
      onReady();
    }
  }

  private createPlayer(videoId: string, onReady: () => void) {
    const div = document.createElement('div');
    div.id = 'yt-player-' + Date.now();
    this.container!.appendChild(div);

    this.player = new window.YT.Player(div.id, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => { this.loaded = true; onReady(); },
        onStateChange: (e: any) => {
          const map: Record<number, 'playing' | 'paused' | 'ended' | 'buffering'> = {
            1: 'playing', 2: 'paused', 0: 'ended', 3: 'buffering',
          };
          this.onStateChange?.(map[e.data] || 'buffering');
        },
      },
    });

    if (this.onTimeUpdate) {
      setInterval(() => {
        if (this.player && this.player.getCurrentTime) {
          this.onTimeUpdate?.(this.player.getCurrentTime());
        }
      }, 1000);
    }
  }

  play(): void { this.player?.playVideo(); }
  pause(): void { this.player?.pauseVideo(); }
  seek(time: number): void { this.player?.seekTo(time, true); }
  getCurrentTime(): number { return this.player?.getCurrentTime?.() || 0; }

  destroy(): void {
    this.player?.destroy();
    this.player = null;
    this.loaded = false;
  }

  setStateChangeHandler(handler: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void): void {
    this.onStateChange = handler;
  }
  setTimeUpdateHandler(handler: (time: number) => void): void {
    this.onTimeUpdate = handler;
  }
}
