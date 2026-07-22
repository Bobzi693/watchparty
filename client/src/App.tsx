import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { Home } from './pages/Home';
import { Room } from './pages/Room';

type View =
  | { page: 'home' }
  | { page: 'room'; roomId: string; userId: string };

function getRoomIdFromUrl(): string | null {
  const match = window.location.pathname.match(/\/room\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

function App() {
  const { socket, connected, error } = useSocket();
  const [view, setView] = useState<View>({ page: 'home' });
  const [initialRoomId, setInitialRoomId] = useState<string | null>(getRoomIdFromUrl());

  useEffect(() => {
    const handlePop = () => setInitialRoomId(getRoomIdFromUrl());
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateToRoom = (roomId: string, userId: string) => {
    window.history.pushState({}, '', `/room/${roomId}`);
    setView({ page: 'room', roomId, userId });
  };

  const handleCreateRoom = useCallback((name: string, userName: string) => {
    socket.emit('create_room', { name, userName }, (err: any, room: any) => {
      if (err) { alert(err); return; }
      navigateToRoom(room.id, room.users[0].id);
    });
  }, [socket]);

  const handleJoinRoom = useCallback((roomId: string, userName: string) => {
    socket.emit('join_room', { roomId, userName }, (err: any, room: any) => {
      if (err) { alert(err); return; }
      const myUser = room.users[room.users.length - 1];
      navigateToRoom(room.id, myUser.id);
    });
  }, [socket]);

  const handleLeave = useCallback(() => {
    socket.emit('leave_room');
    window.history.pushState({}, '', '/');
    setView({ page: 'home' });
    setInitialRoomId(null);
  }, [socket]);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-4">⚠️</p>
          <p className="text-[var(--danger)] font-medium mb-2">Нет соединения с сервером</p>
          <p className="text-[var(--text-muted)] text-sm mb-4">{error}</p>
          <p className="text-[var(--text-muted)] text-xs">1. Запусти server с терминала: <code className="bg-[var(--surface)] px-2 py-0.5 rounded text-xs">cd server ^& npx tsx src/index.ts</code></p>
          <p className="text-[var(--text-muted)] text-xs mt-1">2. Обнови страницу</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Подключение к серверу...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg)] min-h-dvh">
      {view.page === 'home' ? (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialRoomId={initialRoomId}
        />
      ) : (
        <Room
          socket={socket}
          roomId={view.roomId}
          userId={view.userId}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

export default App;
