import { v4 as uuidv4 } from 'uuid';
import { Room, User, VideoState, ChatMessage } from './types';
import * as storage from './storage';

const rooms = new Map<string, Room>();

export function createRoom(name: string, userName: string): Room {
  const roomId = uuidv4().slice(0, 8);
  const userId = uuidv4().slice(0, 8);

  const room: Room = {
    id: roomId,
    name: name || `Room ${roomId}`,
    createdAt: Date.now(),
    currentVideo: null,
    users: [{ id: userId, name: userName, isAdmin: true }],
    messages: [],
  };

  storage.createRoom(roomId, room.name);
  rooms.set(roomId, room);
  return room;
}

export function joinRoom(roomId: string, userName: string): { room: Room; userId: string } | null {
  const room = rooms.get(roomId);

  if (!room) {
    const dbRoom = storage.getRoom(roomId);
    if (!dbRoom) return null;
    const restored: Room = {
      id: dbRoom.id,
      name: dbRoom.name,
      createdAt: dbRoom.createdAt,
      currentVideo: null,
      users: [],
      messages: storage.getMessages(roomId),
    };
    rooms.set(roomId, restored);
  }

  const target = rooms.get(roomId)!;
  const userId = uuidv4().slice(0, 8);
  target.users.push({ id: userId, name: userName, isAdmin: target.users.length === 0 });

  return { room: target, userId };
}

export function leaveRoom(roomId: string, userId: string): User | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const user = room.users.find(u => u.id === userId) || null;
  room.users = room.users.filter(u => u.id !== userId);

  if (room.users.length === 0) {
    rooms.delete(roomId);
    setTimeout(() => storage.deleteRoom(roomId), 60000);
  }

  return user;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function setVideoState(roomId: string, state: VideoState): void {
  const room = rooms.get(roomId);
  if (room) {
    room.currentVideo = state;
    storage.updateRoomVideo(roomId, state.url, state.platform, state.currentTime);
  }
}

export function addMessage(roomId: string, userId: string, userName: string, text: string): ChatMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const msg: ChatMessage = {
    id: uuidv4().slice(0, 8),
    userId,
    userName,
    text,
    timestamp: Date.now(),
  };

  room.messages.push(msg);
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-100);
  }

  storage.saveMessage(msg.id, roomId, userId, userName, text, msg.timestamp);
  return msg;
}

export function setRoomAdmin(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.users.forEach(u => u.isAdmin = (u.id === userId));
  }
}
