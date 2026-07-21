import { useState } from 'react';

interface Props {
  onCreateRoom: (name: string, userName: string) => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  initialRoomId?: string | null;
}

export function Home({ onCreateRoom, onJoinRoom, initialRoomId }: Props) {
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    if (mode === 'create') {
      onCreateRoom(roomName || `Комната ${Date.now()}`, userName);
    } else {
      onJoinRoom(roomId.trim(), userName);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">WatchParty</h1>
          <p className="text-[var(--text-muted)]">Смотри видео вместе с друзьями</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex mb-6 bg-[var(--bg)] rounded-xl p-1">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mode === 'create' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Создать
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mode === 'join' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Войти
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Твоё имя"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />

            {mode === 'create' ? (
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="Название комнаты (необязательно)"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            ) : (
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="ID комнаты"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              {mode === 'create' ? 'Создать комнату' : 'Присоединиться'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Поддерживает YouTube, Rutube, VK Видео и прямые ссылки
          </p>
        </div>
      </div>
    </div>
  );
}
