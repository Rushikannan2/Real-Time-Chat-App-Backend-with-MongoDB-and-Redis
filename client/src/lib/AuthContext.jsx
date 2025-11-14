import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Here you might want to fetch the user profile if you have an endpoint for it
      // For now, we'll just assume the token is valid.
      // A robust implementation would verify the token with the server.
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (userData) => {
    const { data } = await apiClient.post('/auth/signup', userData);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
