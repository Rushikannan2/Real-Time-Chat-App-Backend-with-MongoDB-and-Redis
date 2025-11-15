import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API] Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.status, error.response?.data || error.message);
    
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('[API] Unauthorized - clearing auth data');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (data) => {
    try {
      const response = await apiClient.post('/auth/signup', data);
      return response.data;
    } catch (error) {
      console.error('[Auth API] Signup error:', error.response?.data || error.message);
      throw error;
    }
  },

  login: async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    } catch (error) {
      console.error('[Auth API] Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  getMe: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('[Auth API] Get me error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Rooms API
export const roomsAPI = {
  getRooms: async () => {
    try {
      const response = await apiClient.get('/rooms');
      return response.data;
    } catch (error) {
      console.error('[Rooms API] Get rooms error:', error.response?.data || error.message);
      throw error;
    }
  },

  getAvailableRooms: async () => {
    try {
      const response = await apiClient.get('/rooms/available');
      return response.data;
    } catch (error) {
      console.error('[Rooms API] Get available rooms error:', error.response?.data || error.message);
      throw error;
    }
  },

  createRoom: async (data) => {
    try {
      const response = await apiClient.post('/rooms', data);
      return response.data;
    } catch (error) {
      console.error('[Rooms API] Create room error:', error.response?.data || error.message);
      throw error;
    }
  },

  joinRoom: async (roomId) => {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/join`);
      return response.data;
    } catch (error) {
      console.error('[Rooms API] Join room error:', error.response?.data || error.message);
      throw error;
    }
  },

  addUserToRoom: async (roomId, userId) => {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/users`, { userId });
      return response.data;
    } catch (error) {
      console.error('[Rooms API] Add user error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Messages API
export const messagesAPI = {
  getMessages: async (roomId) => {
    try {
      const response = await apiClient.get(`/chat/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('[Messages API] Get messages error:', error.response?.data || error.message);
      throw error;
    }
  },

  sendMessage: async (roomId, content) => {
    try {
      const response = await apiClient.post(`/chat/${roomId}`, { content });
      return response.data;
    } catch (error) {
      console.error('[Messages API] Send message error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Export convenience functions
export const signup = authAPI.signup;
export const login = authAPI.login;
export const getMe = authAPI.getMe;
export const getRooms = roomsAPI.getRooms;
export const getAvailableRooms = roomsAPI.getAvailableRooms;
export const createRoom = roomsAPI.createRoom;
export const joinRoom = roomsAPI.joinRoom;
export const addUserToRoom = roomsAPI.addUserToRoom;
export const getMessages = messagesAPI.getMessages;
export const sendMessage = messagesAPI.sendMessage;

export default apiClient;
