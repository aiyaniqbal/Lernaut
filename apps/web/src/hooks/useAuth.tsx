"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getCurrentUserSession,
  loginWithEmail,
  loginAsDemoGuest,
  logoutSession,
  registerWithEmail,
  verifyEmailOtp,
  resendEmailOtp,
  AuthActionResult,
} from '@/app/actions/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  learnerId?: string | null;
  avatarUrl?: string;
  levelTitle?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginDemoGuest: () => Promise<AuthActionResult>;
  loginWithCredentials: (email: string, password: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  verifyOtp: (email: string, otp: string) => Promise<AuthActionResult>;
  resendOtp: (email: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'lernaut_auth_user';
const TOKEN_STORAGE_KEY = 'lernaut_auth_token';
const LEGACY_USER_ID_KEY = 'lernaut_user_id';
const DISPLAY_NAME_KEY = 'lernaut_display_name';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  loginDemoGuest: async () => ({ success: false }),
  loginWithCredentials: async () => ({ success: false }),
  register: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  resendOtp: async () => ({ success: false }),
  logout: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize authenticated session state with server
  const refreshSession = useCallback(async () => {
    try {
      const sessionResult = await getCurrentUserSession();

      if (sessionResult.isAuthenticated && sessionResult.user) {
        const u = sessionResult.user;
        const authUser: AuthUser = {
          id: u.id,
          name: u.name,
          email: u.email,
          learnerId: u.learnerId,
          levelTitle: 'Scholar Tier IV',
        };

        setUser(authUser);
        setIsAuthenticated(true);

        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          if (u.learnerId) {
            localStorage.setItem(LEGACY_USER_ID_KEY, u.learnerId);
          }
          if (u.name) {
            localStorage.setItem(DISPLAY_NAME_KEY, u.name);
          }
        }
      } else {
        // No active server session
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Failed to verify session with server:', e);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Register with Email & Password.
   */
  const register = async (name: string, email: string, password: string): Promise<AuthActionResult> => {
    const activeLearnerId = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_USER_ID_KEY) || undefined : undefined;
    return await registerWithEmail({
      name,
      email,
      password,
      learnerId: activeLearnerId,
    });
  };

  /**
   * Verify 6-digit OTP received via Email.
   */
  const verifyOtp = async (email: string, otp: string): Promise<AuthActionResult> => {
    const activeLearnerId = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_USER_ID_KEY) || undefined : undefined;
    const res = await verifyEmailOtp({
      email,
      otp,
      learnerId: activeLearnerId,
    });

    if (res.success && res.user) {
      const authUser: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        learnerId: res.user.learnerId,
        levelTitle: 'Scholar Tier IV',
      };

      setUser(authUser);
      setIsAuthenticated(true);

      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        if (res.user.learnerId) {
          localStorage.setItem(LEGACY_USER_ID_KEY, res.user.learnerId);
        }
        if (res.user.name) {
          localStorage.setItem(DISPLAY_NAME_KEY, res.user.name);
        }
      }
    }

    return res;
  };

  /**
   * Resend 6-digit verification OTP.
   */
  const resendOtp = async (email: string): Promise<AuthActionResult> => {
    return await resendEmailOtp({ email });
  };

  /**
   * Sign In with Email & Password.
   */
  const loginWithCredentials = async (email: string, password: string): Promise<AuthActionResult> => {
    const res = await loginWithEmail({ email, password });

    if (res.success && res.user) {
      const authUser: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        learnerId: res.user.learnerId,
        levelTitle: 'Scholar Tier IV',
      };

      setUser(authUser);
      setIsAuthenticated(true);

      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        if (res.user.learnerId) {
          localStorage.setItem(LEGACY_USER_ID_KEY, res.user.learnerId);
        }
        if (res.user.name) {
          localStorage.setItem(DISPLAY_NAME_KEY, res.user.name);
        }
      }
    }

    return res;
  };

  /**
   * Secure, isolated Demo Guest authentication via server.
   * Eliminates client-side bypasses and prevents impersonating real accounts.
   */
  const loginDemoGuest = async (): Promise<AuthActionResult> => {
    setIsLoading(true);
    try {
      const res = await loginAsDemoGuest();

      if (res.success && res.user) {
        const authUser: AuthUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          learnerId: res.user.learnerId,
          levelTitle: 'Scholar Tier IV',
        };

        setUser(authUser);
        setIsAuthenticated(true);

        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          if (res.user.learnerId) {
            localStorage.setItem(LEGACY_USER_ID_KEY, res.user.learnerId);
          }
          if (res.user.name) {
            localStorage.setItem(DISPLAY_NAME_KEY, res.user.name);
          }
        }
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out current session and invalidate cookies.
   */
  const logout = async () => {
    await logoutSession();

    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('edumind_token');
      localStorage.removeItem('user');
    }

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginDemoGuest,
        loginWithCredentials,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
