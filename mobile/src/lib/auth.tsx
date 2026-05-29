import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
