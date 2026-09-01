'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { saveUserProfile, loadUserProfile } from './firestore';
import { autoSyncManager } from '../services/autoSyncService';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  rating: number;
  preferredColor: 'white' | 'black' | 'both';
  chessComUsername?: string;
  lichessUsername?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (username?: string) => void;
  logout: () => Promise<void>;
  updateUserConnections: (chessCom?: string, lichess?: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  triggerAutoSync: (force?: boolean) => Promise<{ count: number; error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsDemo: () => {},
  logout: async () => {},
  updateUserConnections: async () => {},
  updateProfileName: async () => {},
  triggerAutoSync: async () => ({ count: 0, error: null }),
});

const STORAGE_KEY = 'enpassant_user_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load & Persistence Check
  useEffect(() => {
    const savedLocal = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    let initialUser: UserProfile | null = null;

    if (savedLocal) {
      try {
        initialUser = JSON.parse(savedLocal);
        setUser(initialUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        // Load any stored profile from Firestore
        const remoteProfile = await loadUserProfile(fbUser.uid);
        const merged: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || remoteProfile?.displayName || initialUser?.displayName || 'Grandmaster Student',
          rating: remoteProfile?.rating || initialUser?.rating || 1500,
          preferredColor: remoteProfile?.preferredColor || initialUser?.preferredColor || 'both',
          chessComUsername: remoteProfile?.chessComUsername || initialUser?.chessComUsername || '',
          lichessUsername: remoteProfile?.lichessUsername || initialUser?.lichessUsername || '',
        };

        setUser(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        await saveUserProfile(merged);

        // Trigger AutoSync on authentication if usernames are configured
        if (merged.chessComUsername || merged.lichessUsername) {
          autoSyncManager.autoSync(merged.chessComUsername, merged.lichessUsername);
        }
      } else if (!initialUser) {
        // Create an offline persistent default user so guests can connect and save their usernames effortlessly
        const guestUser: UserProfile = {
          uid: `guest_${Date.now()}`,
          email: null,
          displayName: 'Grandmaster Student',
          rating: 1500,
          preferredColor: 'both',
          chessComUsername: '',
          lichessUsername: '',
        };
        setUser(guestUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. AutoSync on mount if user already has usernames saved
  useEffect(() => {
    if (user && (user.chessComUsername || user.lichessUsername)) {
      autoSyncManager.autoSync(user.chessComUsername, user.lichessUsername);
    }
  }, [user?.chessComUsername, user?.lichessUsername]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Don't auto-downgrade to demo with hardcoded accounts if the user simply cancelled or if popup was closed/blocked
      console.error('Google Sign-in failed or was cancelled:', err);
      throw err;
    }
  };

  const signInAsDemo = (username: string = 'Grandmaster Student') => {
    const demoProfile: UserProfile = {
      uid: `demo_${Date.now()}`,
      email: 'student@enpassant.com',
      displayName: username,
      rating: 1500,
      preferredColor: 'both',
      chessComUsername: '',
      lichessUsername: '',
    };
    setUser(demoProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoProfile));
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('enpassant_last_sync_time');
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignored
    }
    const guestUser: UserProfile = {
      uid: `guest_${Date.now()}`,
      email: null,
      displayName: 'Grandmaster Student',
      rating: 1500,
      preferredColor: 'both',
      chessComUsername: '',
      lichessUsername: '',
    };
    setUser(guestUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
  };

  const updateUserConnections = async (chessCom?: string, lichess?: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      chessComUsername: chessCom !== undefined ? chessCom.trim() : user.chessComUsername,
      lichessUsername: lichess !== undefined ? lichess.trim() : user.lichessUsername,
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Save to Firestore if authenticated
    await saveUserProfile(updated);

    // Trigger immediate sync on updated usernames
    if (updated.chessComUsername || updated.lichessUsername) {
      await autoSyncManager.autoSync(updated.chessComUsername, updated.lichessUsername, true);
    }
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      displayName: name.trim() || 'Grandmaster Student',
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    await saveUserProfile(updated);
  };

  const triggerAutoSync = async (force = false) => {
    if (!user) return { count: 0, error: null };
    return await autoSyncManager.autoSync(user.chessComUsername, user.lichessUsername, force);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsDemo,
        logout,
        updateUserConnections,
        updateProfileName,
        triggerAutoSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
