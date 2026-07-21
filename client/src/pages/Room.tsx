import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { VideoPlayer } from '../components/VideoPlayer';
import { UrlInput } from '../components/UrlInput';
import { Chat } from '../components/Chat';
import { detectPlatform } from '../adapters/types';
import type { PlatformUrlInfo } from '../adapters/types';

interface RoomData {
  id: string;
  name: string;
  currentVideo: { url: string; platform: string; isPlaying: boolean; currentTime: number; videoId: string } | null;
  users: { id: string; name: string; isAdmin: boolean }[];
  messages: { id: string; userId: string; userName: string; text: string; timestamp: number }[];
}

interface Props {
  socket: Socket;
  roomId: string;
  userId: string;
  onLeave: () => void;
}

export function Room({ socket, roomId, userId, onLeave }: Props) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; isAdmin: boolean }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [videoInfo, setVideoInfo] = useState<PlatformUrlInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const isLocalAction = useRef(false);

  useEffect(() => {
    socket.on('room_joined', (data: RoomData) => {
      setRoom(data);
      setUsers(data.users);
      setMessages(data.messages || []);
      if (data.currentVideo) {
        setVideoInfo({ platform: data.currentVideo.platform as any, videoId: data.currentVideo.videoId, url: data.currentVideo.url });
        setIsPlaying(data.currentVideo.isPlaying);
        setCurrentTime(data.currentVideo.currentTime);
      }
    });

    socket.on('user_joined', (user: any) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socket.on('user_left', (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    socket.on('users_list', (usersList: any[]) => {
      setUsers(usersList);
    });

    socket.on('video_sync', (action: any) => {
      if (action.type === 'play' || action.type === 'playing') {
        setIsPlaying(true);
        setCurrentTime(action.time || action.currentTime || 0);
      } else if (action.type === 'pause' || action.type === 'paused') {
        setIsPlaying(false);
        setCurrentTime(action.time || action.currentTime || 0);
      } else if (action.type === 'seek') {
        setCurrentTime(action.time);
      }
    });

    socket.on('video_state', (state: any) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
    });

    socket.on('chat_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('room_joined');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('users_list');
      socket.off('video_sync');
      socket.off('video_state');
      socket.off('chat_message');
    };
  }, [socket]);

  const handleLoadVideo = useCallback((url: string) => {
    const info = detectPlatform(url);
    if (info.platform === 'unknown') {
      alert('Не удалось определить платформу. Попробуй YouTube, Rutube или VK ссылку.');
      return;
    }
    setVideoInfo(info);
    setIsPlaying(false);
    setCurrentTime(0);
    socket.emit('video_action', {
      type: 'load',
      url: info.url,
      platform: info.platform,
      videoId: info.videoId,
    });
  }, [socket]);

  const handlePlay = useCallback((time: number) => {
    isLocalAction.current = true;
    setIsPlaying(true);
    socket.emit('video_action', { type: 'play', time });
  }, [socket]);

  const handlePause = useCallback((time: number) => {
    isLocalAction.current = true;
    setIsPlaying(false);
    socket.emit('video_action', { type: 'pause', time });
  }, [socket]);

  const handleSeek = useCallback((time: number) => {
    isLocalAction.current = true;
    setCurrentTime(time);
    socket.emit('video_action', { type: 'seek', time });
  }, [socket]);

  const handleSendMessage = useCallback((text: string) => {
    socket.emit('send_message', text);
  }, [socket]);

  const handleLeave = () => {
    socket.emit('leave_room');
    onLeave();
  };

  const copyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) return null;

  return (
    <div className="h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer text-lg">←</button>
          <h2 className="text-white font-medium">{room.name}</h2>
          <span className="text-[var(--text-muted)] text-sm">#{room.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="text-[var(--text-muted)] text-sm">{users.length}</span>
          </div>
          <button
            onClick={copyLink}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            {copied ? 'Скопировано!' : 'Ссылка'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
          <UrlInput onLoad={handleLoadVideo} />

          <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
            {videoInfo && videoInfo.platform !== 'unknown' ? (
              <VideoPlayer
                platform={videoInfo.platform}
                videoId={videoInfo.videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onReady={() => socket.emit('request_sync')}
                onLocalAction={() => {}}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <div className="text-center">
                  <p className="text-5xl mb-4">🎬</p>
                  <p>Вставь ссылку на видео чтобы начать</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--surface)] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)]">
            <span className="text-white text-sm font-medium">Чат</span>
            <span className="text-[var(--text-muted)] text-xs">({users.length} в комнате)</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Chat messages={messages} onSend={handleSendMessage} userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
