import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface Props {
  messages: Message[];
  onSend: (text: string) => void;
  userId: string;
}

export function Chat({ messages, onSend, userId }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-[var(--text-muted)] text-sm text-center mt-8">Пока нет сообщений</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`text-sm ${m.userId === userId ? 'text-right' : ''}`}>
            <span className="text-[var(--text-muted)] text-xs mr-1">{m.userName}:</span>
            <span className="text-[var(--text)]">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--border)] flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Напиши что-нибудь..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
