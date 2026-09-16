'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '@/types';
import { getCurrentUserAction, logoutAction as serverLogoutAction } from '@/actions/auth';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  setUser: (user: Profile | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state with real server session cookie on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Purge any stale mock/dummy users from previous sessions
        const cachedUserStr = localStorage.getItem('notemart_user');
        if (cachedUserStr) {
          try {
            const cached = JSON.parse(cachedUserStr);
            if (
              cached.id === 'user-student-1' ||
              cached.id === 'user-seller-1' ||
              cached.id === 'user-admin-1' ||
              cached.email?.includes('demo')
            ) {
              localStorage.removeItem('notemart_user');
              localStorage.removeItem('notemart_user_id');
            } else {
              if (isMounted) setUserState(cached);
            }
          } catch {
            localStorage.removeItem('notemart_user');
            localStorage.removeItem('notemart_user_id');
          }
        }

        // Fetch verified user session from MongoDB via JWT cookie
        const res = await fetch('/api/auth/me', { method: 'GET', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const mappedUser: Profile = {
              id: data.user.id || data.user._id,
              full_name: data.user.name,
              email: data.user.email,
              phone: data.user.phone || '',
              college: data.user.college || '',
              university: data.user.college || '',
              course: data.user.course || '',
              semester: data.user.semester || '',
              role: data.user.role || 'student',
              avatar_url: data.user.profileImage || '',
              created_at: data.user.createdAt || new Date().toISOString(),
              updated_at: data.user.updatedAt || new Date().toISOString(),
            };
            if (isMounted) {
              setUserState(mappedUser);
              localStorage.setItem('notemart_user', JSON.stringify(mappedUser));
              localStorage.setItem('notemart_user_id', mappedUser.id);
            }
            return;
          }
        }

        // Fallback check with server action
        const serverUser = await getCurrentUserAction();
        if (serverUser && isMounted) {
          setUserState(serverUser);
          localStorage.setItem('notemart_user', JSON.stringify(serverUser));
          localStorage.setItem('notemart_user_id', serverUser.id);
        } else {
          // No user logged in - do NOT set dummy/mock users
          if (isMounted) {
            setUserState(null);
            localStorage.removeItem('notemart_user');
            localStorage.removeItem('notemart_user_id');
          }
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
        if (isMounted) {
          setUserState(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
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
      await fetch('/api/auth/logout', { method: 'POST' });
      await serverLogoutAction();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
  }, [setUser]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const mappedUser: Profile = {
            id: data.user.id || data.user._id,
            full_name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            college: data.user.college || '',
            university: data.user.college || '',
            course: data.user.course || '',
            semester: data.user.semester || '',
            role: data.user.role || 'student',
            avatar_url: data.user.profileImage || '',
            created_at: data.user.createdAt || new Date().toISOString(),
            updated_at: data.user.updatedAt || new Date().toISOString(),
          };
          setUser(mappedUser);
          return;
        }
      }
      const serverUser = await getCurrentUserAction();
      if (serverUser) {
        setUser(serverUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
