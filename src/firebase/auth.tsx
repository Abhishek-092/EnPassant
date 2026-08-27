'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

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
  updateUserConnections: (chessCom?: string, lichess?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsDemo: () => {},
  logout: async () => {},
  updateUserConnections: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved local demo profile or Firebase auth state
    const savedDemo = localStorage.getItem('opening_forge_demo_user');
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('opening_forge_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, fbUser => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Grandmaster Student',
          rating: 1500,
          preferredColor: 'both',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Firebase popup failed, switching to demo auth mode:', err);
      signInAsDemo('Forge Player');
    }
  };

  const signInAsDemo = (username: string = 'Grandmaster Student') => {
    const demoProfile: UserProfile = {
      uid: `demo_${Date.now()}`,
      email: 'student@openingforge.com',
      displayName: username,
      rating: 1600,
      preferredColor: 'both',
      chessComUsername: 'hikaru', // Demo defaults for rich out-of-box experience
      lichessUsername: 'magnuscarlsen',
    };
    setUser(demoProfile);
    localStorage.setItem('opening_forge_demo_user', JSON.stringify(demoProfile));
  };

  const logout = async () => {
    localStorage.removeItem('opening_forge_demo_user');
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignored
    }
    setUser(null);
  };

  const updateUserConnections = (chessCom?: string, lichess?: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      chessComUsername: chessCom !== undefined ? chessCom : user.chessComUsername,
      lichessUsername: lichess !== undefined ? lichess : user.lichessUsername,
    };
    setUser(updated);
    localStorage.setItem('opening_forge_demo_user', JSON.stringify(updated));
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
