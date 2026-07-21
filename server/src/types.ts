export interface Room {
  id: string;
  name: string;
  createdAt: number;
  currentVideo: VideoState | null;
  users: User[];
  messages: ChatMessage[];
}

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface VideoState {
  url: string;
  platform: 'youtube' | 'rutube' | 'vkvideovideo' | 'live' | 'direct';
  isPlaying: boolean;
  currentTime: number;
  timestamp: number;
  videoId: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface ServerToClientEvents {
  room_joined: (room: Room) => void;
  user_joined: (user: User) => void;
  user_left: (userId: string) => void;
  video_state: (state: VideoState) => void;
  video_sync: (state: Partial<VideoState>) => void;
  chat_message: (msg: ChatMessage) => void;
  room_error: (error: string) => void;
  users_list: (users: User[]) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { name: string; userName: string }) => void;
  join_room: (data: { roomId: string; userName: string }) => void;
  leave_room: () => void;
  video_action: (action: VideoAction) => void;
  send_message: (text: string) => void;
  request_sync: () => void;
}

export type VideoAction =
  | { type: 'play'; time: number }
  | { type: 'pause'; time: number }
  | { type: 'seek'; time: number }
  | { type: 'load'; url: string; platform: VideoState['platform']; videoId: string }
  | { type: 'speed'; rate: number };
