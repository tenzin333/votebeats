"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (socketRef.current) {
      return;
    }

    const initializeSocket = async () => {
      try {
        // Initialize the Socket.IO server first
        await fetch('/api/socket');
        console.log('🔧 Socket.IO server initialized');

        // Small delay to ensure server is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('🚀 Creating Socket.IO client connection...');

        const newSocket = io({
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('✅ Socket connected:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔴 Socket disconnected:', reason);
          setIsConnected(false);
          
          // Auto-reconnect if server disconnected
          if (reason === 'io server disconnect') {
            newSocket.connect();
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error.message);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Reconnection attempt #', attemptNumber);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('❌ Reconnection error:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('⛔ Reconnection failed after max attempts');
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up socket connection...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}