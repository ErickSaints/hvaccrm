import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from './api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const isSuperAdmin = user?.isSuperAdmin === true && user?.role === 'ADMIN';

  const can = useCallback((permission: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.has(permission);
  }, [permissions, isSuperAdmin]);

  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await api.get<{ permissions: string[] }>('/auth/me/permissions');
      setPermissions(new Set(data.permissions));
    } catch {
      setPermissions(new Set());
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
      setToken(storedToken);
      await fetchPermissions();
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPermissions]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchPermissions();
  }, [fetchPermissions]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPermissions(new Set());
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isSuperAdmin, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
