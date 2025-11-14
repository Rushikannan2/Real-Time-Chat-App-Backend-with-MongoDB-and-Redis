import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (userData) => apiClient.post('/auth/signup', userData);
export const login = (credentials) => apiClient.post('/auth/login', credentials);

export const getRooms = () => apiClient.get('/rooms');
export const createRoom = (roomData) => apiClient.post('/rooms', roomData);
export const joinRoom = (roomId) => apiClient.post(`/rooms/${roomId}/join`);

export const getMessages = (roomId) => apiClient.get(`/chat/${roomId}`);
export const sendMessage = (roomId, messageData) => apiClient.post(`/chat/${roomId}`, messageData);

export default apiClient;
