import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initDatabase } from './storage';
import { setupSocketHandlers } from './socket';
import { getRoom } from './rooms';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

initDatabase();
setupSocketHandlers(io);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/room/:id', (req, res) => {
  res.json({ exists: !!getRoom(req.params.id) });
});

const clientPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n  🎬 WatchParty запущен!\n`);
  console.log(`  Локально:    http://localhost:${PORT}`);
  console.log(`  В сети WiFi: http://${ip}:${PORT}`);
  console.log(`  API:         http://localhost:${PORT}/api/health\n`);
});
