import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 15000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setError('Соединение потеряно');
      }
    });

    socket.on('connect_error', (err) => {
      setError(`Не могу подключиться: ${err.message}`);
    });

    return () => { socket.close(); };
  }, []);

  return { socket: socketRef.current!, connected, error };
}
