import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

const useSocket = () => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { addMessage, setTyping, addOnlineUser, removeOnlineUser } = useChatStore();

  // Connect to Socket.IO
  const connect = useCallback(() => {
    if (!token || !user) {
      console.log('[Socket] No auth token or user, skipping connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    console.log('[Socket] Connecting to', WS_URL);
    
    const socket = io(WS_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
      console.log('[Socket] User object:', user);
      setIsConnected(true);
      
      // Emit setup event with userId (backward compatibility)
      const userId = user?.id || user?._id;
      if (userId) {
        socket.emit('setup', userId);
        console.log('[Socket] Sent setup event for user:', userId);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
      
      // If auth error, might need to re-login
      if (error.message.includes('Authentication') || error.message.includes('Invalid') || error.message.includes('expired')) {
        console.error('[Socket] Authentication failed - token might be invalid');
        console.log('[Socket] Current token:', token ? `${token.substring(0, 20)}...` : 'none');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      
      // Auto-reconnect on unexpected disconnects
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        console.log('[Socket] Server disconnected, attempting reconnect');
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after all attempts');
    });

    // Message handlers
    socket.on('receiveMessage', (message) => {
      console.log('[Socket] Received message:', message);
      addMessage(message);
    });

    // Typing indicator
    socket.on('typing', ({ userId, typing }) => {
      console.log(`[Socket] User ${userId} typing:`, typing);
      const currentRoom = useChatStore.getState().currentRoom;
      if (currentRoom) {
        setTyping(currentRoom._id, userId, typing);
      }
    });

    // Error handling
    socket.on('error', ({ message }) => {
      console.error('[Socket] Server error:', message);
    });

    // Presence events (if backend implements them)
    socket.on('userOnline', (userId) => {
      console.log('[Socket] User online:', userId);
      addOnlineUser(userId);
    });

    socket.on('userOffline', (userId) => {
      console.log('[Socket] User offline:', userId);
      removeOnlineUser(userId);
    });

    socketRef.current = socket;
  }, [token, user, addMessage, setTyping, addOnlineUser, removeOnlineUser]);

  // Disconnect from Socket.IO
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[Socket] Disconnecting');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current) {
      console.error('[Socket] Cannot join room - not connected');
      return;
    }
    
    console.log('[Socket] Joining room:', roomId);
    socketRef.current.emit('joinRoom', roomId);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    if (!socketRef.current) {
      console.error('[Socket] Cannot leave room - not connected');
      return;
    }
    
    console.log('[Socket] Leaving room:', roomId);
    socketRef.current.emit('leaveRoom', roomId);
  }, []);

  // Send a message
  const sendMessage = useCallback((roomId, content, attachments = [], metadata = {}) => {
    if (!socketRef.current) {
      console.error('[Socket] Cannot send message - not connected');
      return Promise.reject(new Error('Not connected to socket'));
    }

    const userId = user?.id || user?._id;
    if (!userId) {
      console.error('[Socket] Cannot send message - no user ID. User object:', user);
      return Promise.reject(new Error('No user ID'));
    }

    const payload = {
      room: roomId,
      content,
      attachments,
      metadata,
    };

    console.log('[Socket] Sending message to room:', roomId);
    socketRef.current.emit('sendMessage', payload);
    
    return Promise.resolve();
  }, [user]);

  // Send typing indicator
  const sendTyping = useCallback((roomId, isTyping) => {
    if (!socketRef.current) return;
    if (!user?._id) return;

    socketRef.current.emit('typing', {
      room: roomId,
      userId: user._id,
      typing: isTyping,
    });
  }, [user]);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    connect,
    disconnect,
  };
};

export default useSocket;
