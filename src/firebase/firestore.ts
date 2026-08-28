import { db } from './config';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { UserProfile } from './auth';
import { UserMistakeRecord, CachedGame } from '../storage/indexedDB';

/**
 * Save user profile to Firestore `users/{uid}`
 */
export async function saveUserProfile(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        username: user.displayName,
        email: user.email,
        rating: user.rating,
        preferredColor: user.preferredColor,
        chessComUsername: user.chessComUsername || '',
        lichessUsername: user.lichessUsername || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore saveUserProfile skipped (check permissions or offline mode):', err);
  }
}

/**
 * Load user profile from Firestore `users/{uid}`
 */
export async function loadUserProfile(uid: string): Promise<Partial<UserProfile> | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        displayName: data.username || undefined,
        email: data.email || undefined,
        rating: data.rating || 1500,
        preferredColor: data.preferredColor || 'both',
        chessComUsername: data.chessComUsername || undefined,
        lichessUsername: data.lichessUsername || undefined,
      };
    }
  } catch (err) {
    console.warn('Firestore loadUserProfile skipped:', err);
  }
  return null;
}

/**
 * Save user game record to Firestore `users/{uid}/games/{gameId}`
 */
export async function saveUserGame(uid: string, game: CachedGame): Promise<void> {
  try {
    const gameRef = doc(db, 'users', uid, 'games', game.id);
    await setDoc(gameRef, {
      ...game,
      syncedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore saveUserGame skipped:', err);
  }
}

/**
 * Save personal mistake record to Firestore `users/{uid}/mistakes/{mistakeId}`
 */
export async function saveUserMistake(uid: string, mistake: UserMistakeRecord): Promise<void> {
  try {
    const mistakeRef = doc(db, 'users', uid, 'mistakes', mistake.id);
    await setDoc(mistakeRef, {
      ...mistake,
      syncedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore saveUserMistake skipped:', err);
  }
}
