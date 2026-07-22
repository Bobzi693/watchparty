import { useEffect, useRef, useCallback } from 'react';
import type { PlayerAdapter } from '../adapters/types';
import { createAdapter } from '../adapters';

interface Props {
  platform: string;
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onReady: () => void;
}

export function VideoPlayer({
  platform, videoId, isPlaying, currentTime,
  onPlay, onPause, onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<PlayerAdapter | null>(null);
  const lastTime = useRef(0);
  const ignoreNext = useRef(false);

  const handleStateChange = useCallback((state: string) => {
    if (ignoreNext.current) { ignoreNext.current = false; return; }
    if (state === 'playing') onPlay(Date.now());
    else if (state === 'paused') onPause(Date.now());
  }, [onPlay, onPause]);

  const handleTimeUpdate = useCallback((time: number) => {
    if (Math.abs(time - lastTime.current) > 2) {
      lastTime.current = time;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !videoId || platform === 'unknown') return;

    const adapter = createAdapter(platform as any);
    if (!adapter) return;

    adapterRef.current = adapter;
    adapter.setStateChangeHandler(handleStateChange);
    adapter.setTimeUpdateHandler(handleTimeUpdate);

    adapter.loadVideo(containerRef.current, videoId, () => {
      onReady();
    });

    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [platform, videoId]);

  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    ignoreNext.current = true;

    if (isPlaying) {
      if (currentTime > 0) adapter.seek(currentTime);
      setTimeout(() => adapter.play(), 100);
    } else {
      adapter.pause();
      if (currentTime > 0) adapter.seek(currentTime);
    }
  }, [isPlaying, currentTime]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black rounded-xl overflow-hidden" />
  );
}
