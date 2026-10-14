"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  levelTitle?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Partial<AuthUser> & { email: string; name?: string }, token?: string) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'lernaut_auth_user';
const TOKEN_STORAGE_KEY = 'lernaut_auth_token';
const LEGACY_USER_ID_KEY = 'lernaut_user_id';
const DISPLAY_NAME_KEY = 'lernaut_display_name';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token') || localStorage.getItem('edumind_token');
        const storedUserId = localStorage.getItem(LEGACY_USER_ID_KEY);
        const storedName = localStorage.getItem(DISPLAY_NAME_KEY);

        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed && parsed.email) {
            setUser(parsed);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // If a valid token or persistent user id exists, initialize default active session
        if (storedToken && storedUserId) {
          const fallbackUser: AuthUser = {
            id: storedUserId,
            name: storedName || 'Aiyan Iqbal',
            email: 'aiyaniqbal77@gmail.com',
            levelTitle: 'Scholar Tier IV',
          };
          setUser(fallbackUser);
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: Partial<AuthUser> & { email: string; name?: string }, token = 'session-active') => {
    const userId = userData.id || localStorage.getItem(LEGACY_USER_ID_KEY) || crypto.randomUUID();
    const displayName = userData.name || userData.email.split('@')[0] || 'Learner';

    const fullUser: AuthUser = {
      id: userId,
      name: displayName,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      levelTitle: userData.levelTitle || 'Scholar Tier IV',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(LEGACY_USER_ID_KEY, userId);
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);

    setUser(fullUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove auth token and active session, but preserve user ID so student progress remains intact
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('edumind_token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
