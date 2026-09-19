import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as fbSignOut,
} from 'firebase/auth';
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0811537590',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:313207946912:web:52327000aabf0e753f93c5',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDbS0kiuLvnvqFMpz6-_W0e69EJpQMb7uw',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0811537590.firebaseapp.com',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0811537590.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '313207946912',
};

// Safe app initialization
const getFirebaseApp = () => {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
};

export const auth = typeof window !== 'undefined' ? getAuth(getFirebaseApp()) : (null as any);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flags & in-memory token cache (strictly in memory, per security requirements)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (typeof window === 'undefined' || !auth) return () => {};

  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in via Firebase session but token not in memory, user will click reconnect or re-auth
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (typeof window === 'undefined' || !auth) return null;

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[GoogleAuth] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser;
};

export const logout = async (): Promise<void> => {
  if (typeof window !== 'undefined' && auth) {
    await fbSignOut(auth);
  }
  cachedAccessToken = null;
  cachedUser = null;
};
