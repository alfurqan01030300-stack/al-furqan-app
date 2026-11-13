import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const FIREBASE_HOSTING_URL = 'https://al-furqan-e11b7.web.app';

const OFFICIAL_HOSTING_DOMAINS = new Set([
  'al-furqan-e11b7.web.app',
  'al-furqan-e11b7.firebaseapp.com',
]);

/**
 * Returns true ONLY when the app is running on the fixed, officially authorized Firebase Hosting domain.
 */
export function isOfficialHostingDomain(): boolean {
  if (typeof window === 'undefined') return true;
  const host = (window.location.hostname || '').toLowerCase();
  return OFFICIAL_HOSTING_DOMAINS.has(host);
}

/**
 * Returns true when opened from any preview/dev domain (e.g. ais-dev, ais-pre, run.app, localhost)
 * instead of the official fixed Firebase Hosting domain.
 */
export function isTemporaryPreviewHost(): boolean {
  return !isOfficialHostingDomain();
}

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Offline IndexedDB Persistence & Multi-Tab Sync
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Initialize Firebase Auth with persistent local session
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence notice:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthResult {
  user: User | null;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Strict Popup-only Google Sign-In. Never attempts Firebase Auth from preview domains.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (isTemporaryPreviewHost()) {
    return { user: null };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    const code = error?.code || 'unknown';
    if (code === 'auth/popup-blocked') {
      return {
        user: null,
        errorCode: code,
        errorMessage:
          'المتصفح منع نافذة الدخول المنبثقة (Popup). يرجى السماح بالنوافذ المنبثقة ثم الضغط على «الدخول بجوجل» مرة أخرى.',
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        user: null,
        errorCode: code,
        errorMessage: 'تم إغلاق نافذة تسجيل الدخول قبل إتمام الدخول.',
      };
    }
    if (code === 'auth/unauthorized-domain') {
      return { user: null };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        user: null,
        errorCode: code,
        errorMessage:
          'يرجى التأكد من تفعيل مزود Google داخل Firebase Console > Authentication > Sign-in method.',
      };
    }
    return {
      user: null,
      errorCode: code,
      errorMessage: 'تعذر تسجيل الدخول بجوجل. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.',
    };
  }
}

export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
}

// Error Handling Enums & Types adhering to Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

// Validate connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return false;
    }
    return true;
  }
}
