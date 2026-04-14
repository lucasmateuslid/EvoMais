import { io, type Socket } from 'socket.io-client';

import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getRealtimeSocket() {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      activeToken = null;
    }
    return null;
  }

  if (socket && activeToken === token && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(BACKEND_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: true,
    auth: {
      token,
    },
  });

  activeToken = token;
  return socket;
}

export function disconnectRealtimeSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
  activeToken = null;
}
