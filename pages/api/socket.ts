import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket?.server?.io) {
    console.log('✅ Socket.IO server already running');
    res.end();
    return;
  }

  console.log('🚀 Initializing Socket.IO server...');

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('vote-update', (data) => {
      console.log('🗳️ Vote update received:', data);
      // Broadcast to all clients including sender
      io.emit('vote-update', data);
      console.log('📢 Broadcasted to all clients');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  res.socket.server.io = io;
  console.log('✨ Socket.IO server initialized successfully');
  res.end();
};

export default SocketHandler;