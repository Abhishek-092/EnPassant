import { db } from './config';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { UserProfile } from './auth';

/**
 * Save user profile and platform credentials to Firestore `users/{uid}`
 * Only stores user metadata & connected usernames (Chess.com, Lichess) to minimize Firestore write costs.
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
 * Load user profile & connected platform usernames from Firestore `users/{uid}`
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
