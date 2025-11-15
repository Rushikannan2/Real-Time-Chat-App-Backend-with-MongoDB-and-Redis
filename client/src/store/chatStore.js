import { create } from 'zustand';
import { roomsAPI, messagesAPI } from '../services/api';

const useChatStore = create((set, get) => ({
  // State
  rooms: [],
  currentRoom: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},
  isLoadingRooms: false,
  isLoadingMessages: false,

  // Fetch all rooms
  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      console.log('[Chat Store] Fetching rooms');
      const data = await roomsAPI.getRooms();
      const rooms = data.rooms || [];
      console.log(`[Chat Store] Fetched ${rooms.length} rooms`);
      set({ rooms, isLoadingRooms: false });
      return rooms;
    } catch (error) {
      console.error('[Chat Store] Fetch rooms error:', error);
      set({ isLoadingRooms: false });
      throw error;
    }
  },

  // Create a new room
  createRoom: async (name, isPrivate, participants) => {
    try {
      console.log('[Chat Store] Creating room:', name);
      const data = await roomsAPI.createRoom({ name, isPrivate, participants });
      const newRoom = data.room;
      
      set((state) => ({ 
        rooms: [...state.rooms, newRoom] 
      }));
      
      console.log('[Chat Store] Room created:', newRoom._id);
      return newRoom;
    } catch (error) {
      console.error('[Chat Store] Create room error:', error);
      throw error;
    }
  },

  // Set current room
  setCurrentRoom: (room) => {
    console.log('[Chat Store] Setting current room:', room?._id);
    set({ currentRoom: room });
  },

  // Fetch messages for a room
  fetchMessages: async (roomId) => {
    if (!roomId) return;
    
    set({ isLoadingMessages: true });
    try {
      console.log('[Chat Store] Fetching messages for room:', roomId);
      const messages = await messagesAPI.getMessages(roomId);
      console.log(`[Chat Store] Fetched ${messages.length} messages`);
      
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: messages,
        },
        isLoadingMessages: false,
      }));
      
      return messages;
    } catch (error) {
      console.error('[Chat Store] Fetch messages error:', error);
      set({ isLoadingMessages: false });
      throw error;
    }
  },

  // Add a message to a room (from Socket.IO)
  addMessage: (message) => {
    const roomId = message.room;
    console.log('[Chat Store] Adding message to room:', roomId);
    
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      
      // Check if message already exists (by _id)
      const exists = roomMessages.some(m => m._id === message._id);
      if (exists) {
        console.log('[Chat Store] Message already exists, skipping');
        return state;
      }
      
      return {
        messages: {
          ...state.messages,
          [roomId]: [...roomMessages, message],
        },
      };
    });
    
    // Update lastMessageAt for the room
    get().updateRoomLastMessage(roomId, message);
  },

  // Update room's last message
  updateRoomLastMessage: (roomId, message) => {
    set((state) => ({
      rooms: state.rooms.map(room => 
        room._id === roomId 
          ? { 
              ...room, 
              lastMessage: message,
              lastMessageAt: message.createdAt || new Date().toISOString()
            }
          : room
      ),
    }));
  },

  // Set online users
  setOnlineUsers: (users) => {
    console.log('[Chat Store] Setting online users:', users.length);
    set({ onlineUsers: new Set(users) });
  },

  // Add online user
  addOnlineUser: (userId) => {
    console.log('[Chat Store] User came online:', userId);
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    });
  },

  // Remove online user
  removeOnlineUser: (userId) => {
    console.log('[Chat Store] User went offline:', userId);
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    });
  },

  // Set typing status for a user in a room
  setTyping: (roomId, userId, isTyping) => {
    console.log(`[Chat Store] User ${userId} typing in room ${roomId}:`, isTyping);
    set((state) => {
      const roomTyping = state.typingUsers[roomId] || new Set();
      const newRoomTyping = new Set(roomTyping);
      
      if (isTyping) {
        newRoomTyping.add(userId);
      } else {
        newRoomTyping.delete(userId);
      }
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: newRoomTyping,
        },
      };
    });
  },

  // Clear all chat data (on logout)
  clearChatData: () => {
    console.log('[Chat Store] Clearing chat data');
    set({
      rooms: [],
      currentRoom: null,
      messages: {},
      onlineUsers: new Set(),
      typingUsers: {},
    });
  },
}));

export default useChatStore;
