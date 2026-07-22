import { useState } from 'react';

interface Props {
  onLoad: (url: string) => void;
  currentUrl?: string;
}

export function UrlInput({ onLoad }: Props) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onLoad(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Вставь ссылку: YouTube, Rutube, VK Видео, MP4..."
        className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
      />
      <button
        type="submit"
        className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors cursor-pointer shrink-0"
      >
        Загрузить
      </button>
    </form>
  );
}
