import type { Platform, PlayerAdapter } from './types';

declare global {
  interface Window {
    VK: any;
  }
}

export class VKVideoAdapter implements PlayerAdapter {
  platform: Platform = 'vkvideo';
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private player: any = null;
  private onStateChange: ((state: 'playing' | 'paused' | 'ended' | 'buffering') => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private timeInterval: any = null;

  loadVideo(element: HTMLElement, videoId: string, onReady: () => void): void {
    this.container = element;
    this.container.innerHTML = '';

    const [oid, id] = videoId.split('_');
    const src = `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=1&js_api=1`;

    this.iframe = document.createElement('iframe');
    this.iframe.src = src;
    this.iframe.width = '100%';
    this.iframe.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.allow = 'autoplay; encrypted-media; fullscreen';
    this.iframe.allowFullscreen = true;
    this.container.appendChild(this.iframe);

    if (!window.VK) {
      const script = document.createElement('script');
      script.src = 'https://vk.com/js/api/videoplayer.js';
      script.onload = () => this.initPlayer(onReady);
      document.head.appendChild(script);
    } else {
      this.initPlayer(onReady);
    }
  }

  private initPlayer(onReady: () => void) {
    if (!this.iframe) return;

    const checkLoaded = setInterval(() => {
      try {
        this.player = window.VK?.VideoPlayer?.(this.iframe);
        if (this.player) {
          clearInterval(checkLoaded);
          this.player.on('inited', () => {
            onReady();
          });
          this.player.on('paused', () => this.onStateChange?.('paused'));
          this.player.on('started', () => this.onStateChange?.('playing'));
          this.player.on('resumed', () => this.onStateChange?.('playing'));
          this.player.on('ended', () => this.onStateChange?.('ended'));

          this.timeInterval = setInterval(() => {
            const time = this.player?.getCurrentTime?.();
            if (time !== undefined) {
              this.onTimeUpdate?.(time);
            }
          }, 1000);
        }
      } catch {}
    }, 500);

    setTimeout(() => clearInterval(checkLoaded), 10000);
  }

  play(): void { this.player?.play(); }
  pause(): void { this.player?.pause(); }
  seek(time: number): void { this.player?.seek(time); }
  getCurrentTime(): number { return this.player?.getCurrentTime?.() || 0; }

  destroy(): void {
    clearInterval(this.timeInterval);
    this.player?.destroy();
    if (this.container) this.container.innerHTML = '';
    this.iframe = null;
    this.player = null;
  }

  setStateChangeHandler(handler: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void): void {
    this.onStateChange = handler;
  }
  setTimeUpdateHandler(handler: (time: number) => void): void {
    this.onTimeUpdate = handler;
  }
}
