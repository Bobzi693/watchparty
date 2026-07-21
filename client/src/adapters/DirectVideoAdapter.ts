import type { Platform, PlayerAdapter } from './types';

export class DirectVideoAdapter implements PlayerAdapter {
  platform: Platform = 'direct';
  private video: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  private onStateChange: ((state: 'playing' | 'paused' | 'ended' | 'buffering') => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private loaded = false;

  loadVideo(element: HTMLElement, videoId: string, onReady: () => void): void {
    this.container = element;
    this.container.innerHTML = '';

    this.video = document.createElement('video');
    this.video.src = videoId;
    this.video.controls = true;
    this.video.autoplay = true;
    this.video.style.width = '100%';
    this.video.style.height = '100%';
    this.video.style.background = '#000';
    this.container.appendChild(this.video);

    this.video.addEventListener('loadedmetadata', () => {
      this.loaded = true;
      onReady();
    });
    this.video.addEventListener('play', () => this.onStateChange?.('playing'));
    this.video.addEventListener('pause', () => this.onStateChange?.('paused'));
    this.video.addEventListener('ended', () => this.onStateChange?.('ended'));
    this.video.addEventListener('waiting', () => this.onStateChange?.('buffering'));
    this.video.addEventListener('timeupdate', () => {
      this.onTimeUpdate?.(this.video?.currentTime || 0);
    });
  }

  play(): void {
    if (this.video && this.loaded) this.video.play();
  }
  pause(): void { this.video?.pause(); }
  seek(time: number): void { if (this.video) this.video.currentTime = time; }
  getCurrentTime(): number { return this.video?.currentTime || 0; }
  destroy(): void {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
    }
    if (this.container) this.container.innerHTML = '';
    this.video = null;
    this.loaded = false;
  }

  setStateChangeHandler(handler: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void): void {
    this.onStateChange = handler;
  }
  setTimeUpdateHandler(handler: (time: number) => void): void {
    this.onTimeUpdate = handler;
  }
}
