import { Server, Socket } from 'socket.io';
import * as rooms from './rooms';
import { VideoAction } from './types';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;

    socket.on('create_room', ({ name, userName }, ack) => {
      const room = rooms.createRoom(name, userName);
      socket.join(room.id);
      currentRoomId = room.id;

      socket.data.userId = room.users[0].id;
      socket.data.userName = userName;

      if (typeof ack === 'function') ack(null, room);
      else socket.emit('room_joined', room);
    });

    socket.on('join_room', ({ roomId, userName }, ack) => {
      const result = rooms.joinRoom(roomId, userName);
      if (!result) {
        const msg = 'Комната не найдена';
        if (typeof ack === 'function') ack(msg);
        else socket.emit('room_error', msg);
        return;
      }

      const { room, userId } = result;

      socket.to(roomId).emit('user_joined', { id: userId, name: userName, isAdmin: false });

      socket.join(roomId);
      currentRoomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = userName;

      if (typeof ack === 'function') ack(null, room);
      else socket.emit('room_joined', room);
    });

    socket.on('leave_room', () => {
      handleLeave();
    });

    socket.on('disconnect', () => {
      handleLeave();
    });

    function handleLeave() {
      if (!currentRoomId) return;
      const userId = socket.data.userId;
      const user = rooms.leaveRoom(currentRoomId, userId);
      if (user) {
        socket.to(currentRoomId).emit('user_left', user.id);
        const room = rooms.getRoom(currentRoomId);
        if (room) {
          socket.to(currentRoomId).emit('users_list', room.users);
        }
      }
      currentRoomId = null;
    }

    socket.on('video_action', (action: VideoAction) => {
      if (!currentRoomId) return;

      if (action.type === 'load') {
        rooms.setVideoState(currentRoomId, {
          url: action.url,
          platform: action.platform,
          isPlaying: false,
          currentTime: 0,
          timestamp: Date.now(),
          videoId: action.videoId,
        });
      }

      const room = rooms.getRoom(currentRoomId);
      if (room?.currentVideo) {
        const stateUpdate: any = { timestamp: Date.now() };
        if (action.type === 'play') {
          stateUpdate.isPlaying = true;
          stateUpdate.currentTime = action.time;
        } else if (action.type === 'pause') {
          stateUpdate.isPlaying = false;
          stateUpdate.currentTime = action.time;
        } else if (action.type === 'seek') {
          stateUpdate.currentTime = action.time;
        }
        Object.assign(room.currentVideo, stateUpdate);
      }

      socket.to(currentRoomId).emit('video_sync', {
        ...action,
        timestamp: Date.now(),
      });
    });

    socket.on('request_sync', () => {
      if (!currentRoomId) return;
      const room = rooms.getRoom(currentRoomId);
      if (room?.currentVideo) {
        socket.emit('video_state', room.currentVideo);
      }
    });

    socket.on('send_message', (text: string) => {
      if (!currentRoomId || !text.trim()) return;
      const userId = socket.data.userId;
      const userName = socket.data.userName;
      const msg = rooms.addMessage(currentRoomId, userId, userName, text.trim());
      if (msg) {
        socket.to(currentRoomId).emit('chat_message', msg);
      }
    });
  });
}
