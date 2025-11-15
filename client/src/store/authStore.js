import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage
  initialize: () => {
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('[Auth Store] Initializing with stored auth:', user.email);
        set({ 
          token, 
          user, 
          isAuthenticated: true,
          error: null 
        });
      } else {
        console.log('[Auth Store] No stored auth found');
      }
    } catch (error) {
      console.error('[Auth Store] Initialize error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Signup action
  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[Auth Store] Signup attempt:', email);
      const data = await authAPI.signup({ name, email, password });
      
      // Store token and user
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      
      console.log('[Auth Store] Signup successful:', data.user.email);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed';
      console.error('[Auth Store] Signup error:', errorMessage);
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        token: null
      });
      throw error;
    }
  },

  // Login action
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[Auth Store] Login attempt:', email);
      const data = await authAPI.login({ email, password });
      
      // Store token and user
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      
      console.log('[Auth Store] Login successful:', data.user.email);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      console.error('[Auth Store] Login error:', errorMessage);
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        token: null
      });
      throw error;
    }
  },

  // Logout action
  logout: () => {
    console.log('[Auth Store] Logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      error: null
    });
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      console.log('[Auth Store] Refreshing user data');
      const data = await authAPI.getMe();
      const updatedUser = data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      
      console.log('[Auth Store] User data refreshed');
      return updatedUser;
    } catch (error) {
      console.error('[Auth Store] Refresh user error:', error);
      // If refresh fails, logout
      get().logout();
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
