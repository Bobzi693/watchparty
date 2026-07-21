import type { Platform, PlayerAdapter } from './types';

export class RutubeAdapter implements PlayerAdapter {
  platform: Platform = 'rutube';
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private onStateChange: ((state: 'playing' | 'paused' | 'ended' | 'buffering') => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private currentVideoId: string | null = null;
  private ready = false;
  private timeInterval: any = null;

  loadVideo(element: HTMLElement, videoId: string, onReady: () => void): void {
    this.container = element;
    this.currentVideoId = videoId;
    this.container.innerHTML = '';

    this.iframe = document.createElement('iframe');
    this.iframe.src = `https://rutube.ru/play/embed/${videoId}?autoplay=1`;
    this.iframe.width = '100%';
    this.iframe.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen';
    this.iframe.allowFullscreen = true;
    this.container.appendChild(this.iframe);

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'player:ready') {
          this.ready = true;
          onReady();
        }
        if (msg.type === 'player:changeState') {
          const stateMap: Record<string, 'playing' | 'paused' | 'ended' | 'buffering'> = {
            playing: 'playing', paused: 'paused', stopped: 'ended',
          };
          this.onStateChange?.(stateMap[msg.data.state] || 'buffering');
        }
        if (msg.type === 'player:currentTime') {
          this.onTimeUpdate?.(msg.data.currentTime);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);

    this.timeInterval = setInterval(() => {
      if (this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage(JSON.stringify({ type: 'player:getCurrentTime', data: {} }), '*');
      }
    }, 2000);
  }

  private postMessage(type: string, data: any = {}) {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(JSON.stringify({ type, data }), '*');
    }
  }

  play(): void { this.postMessage('player:play'); }
  pause(): void { this.postMessage('player:pause'); }
  seek(time: number): void { this.postMessage('player:setCurrentTime', { time }); }
  getCurrentTime(): number { return 0; }

  destroy(): void {
    clearInterval(this.timeInterval);
    if (this.container && this.iframe) {
      this.container.innerHTML = '';
    }
    this.iframe = null;
    this.ready = false;
  }

  setStateChangeHandler(handler: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void): void {
    this.onStateChange = handler;
  }
  setTimeUpdateHandler(handler: (time: number) => void): void {
    this.onTimeUpdate = handler;
  }
}
