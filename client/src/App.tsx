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
  const { socket, connected } = useSocket();
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
    socket.emit('create_room', { name, userName });
    socket.once('room_joined', (room: any) => {
      navigateToRoom(room.id, room.users[0].id);
    });
  }, [socket]);

  const handleJoinRoom = useCallback((roomId: string, userName: string) => {
    socket.emit('join_room', { roomId, userName });
    socket.once('room_joined', (room: any) => {
      const myUser = room.users[room.users.length - 1];
      navigateToRoom(room.id, myUser.id);
    });
    socket.once('room_error', () => {
      alert('Комната не найдена');
    });
  }, [socket]);

  const handleLeave = useCallback(() => {
    window.history.pushState({}, '', '/');
    setView({ page: 'home' });
    setInitialRoomId(null);
  }, []);

  if (!connected) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-muted)]">Подключение к серверу...</p>
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
