'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '@/types';
import { getCurrentUserAction, logoutAction as serverLogoutAction, switchSessionUserAction } from '@/actions/auth';
import { store } from '@/lib/store';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  setUser: (user: Profile | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  switchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state with localStorage & cookie on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Fast local recovery
        const cachedUserStr = localStorage.getItem('notemart_user');
        if (cachedUserStr) {
          try {
            const cached = JSON.parse(cachedUserStr);
            setUserState(cached);
          } catch {
            localStorage.removeItem('notemart_user');
          }
        }

        // Verify with server session cookie
        const serverUser = await getCurrentUserAction();
        if (serverUser) {
          setUserState(serverUser);
          localStorage.setItem('notemart_user', JSON.stringify(serverUser));
          localStorage.setItem('notemart_user_id', serverUser.id);
        } else if (!cachedUserStr) {
          // Default to student demo user if nothing is set yet, so initial browse works
          const defaultUser = store.getUsers()[2];
          setUserState(defaultUser);
          localStorage.setItem('notemart_user', JSON.stringify(defaultUser));
          localStorage.setItem('notemart_user_id', defaultUser.id);
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUser = useCallback((newUser: Profile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('notemart_user', JSON.stringify(newUser));
      localStorage.setItem('notemart_user_id', newUser.id);
    } else {
      localStorage.removeItem('notemart_user');
      localStorage.removeItem('notemart_user_id');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await serverLogoutAction();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
  }, [setUser]);

  const refreshUser = useCallback(async () => {
    try {
      const serverUser = await getCurrentUserAction();
      if (serverUser) {
        setUser(serverUser);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [setUser]);

  const switchUser = useCallback(async (userId: string) => {
    try {
      const res = await switchSessionUserAction(userId);
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Switch user error:', err);
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
