import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User as FirebaseUser,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  collection,
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { UserProfile } from './types';

// Import configuration generated from ProvisionFirebase
import firebaseConfig from '../firebase-applet-config.json';
export { firebaseConfig };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the provisioned custom firestoreDatabaseId
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const auth = getAuth(app);

// Connection test per Firebase skill instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: client is currently offline or connecting');
    }
  }
}

testConnection();

// ==========================================
// --- REAL-TIME PHONE OTP AUTHENTICATION ---
// ==========================================

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

/**
 * Initializes invisible or normal RecaptchaVerifier for real SMS OTP delivery
 */
export function initPhoneRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  // Clear any existing verifier instance
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {}
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('Recaptcha verified for Phone OTP');
    },
    'expired-callback': () => {
      console.warn('Recaptcha expired. Please request OTP again.');
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends a REAL OTP SMS to the student's mobile number via Firebase Phone Auth
 */
export async function sendFirebasePhoneOtp(
  rawPhoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // Ensure international standard E.164 format (+91 for India if not included)
  let clean = rawPhoneNumber.trim();
  if (!clean.startsWith('+')) {
    const digits = clean.replace(/\D/g, '').slice(-10);
    clean = `+91${digits}`;
  }

  const confirmationResult = await signInWithPhoneNumber(auth, clean, verifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}

/**
 * Verifies the 6-digit real OTP entered by the student
 */
export async function verifyFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<FirebaseUser> {
  const result = await confirmationResult.confirm(otpCode.trim());
  return result.user;
}

// ==========================================
// --- FIRESTORE USER PROFILE PERSISTENCE ---
// ==========================================

import { PREDEFINED_ACCOUNTS, findPredefinedAccountByPhone } from './data/predefinedUsers';
import { safeStorage } from './utils/storage';

const REGISTERED_USERS_KEY = 'idhar_udhar_registered_users';

function getLocalRegisteredUsers(): Record<string, UserProfile> {
  return safeStorage.getJSON<Record<string, UserProfile>>(REGISTERED_USERS_KEY, {}) || {};
}

function saveLocalRegisteredUser(cleanPhone: string, profile: UserProfile) {
  try {
    const existing = getLocalRegisteredUsers();
    existing[cleanPhone] = profile;
    safeStorage.setJSON(REGISTERED_USERS_KEY, existing);
  } catch {}
}

export async function fetchFirestoreUserProfile(uid: string): Promise<UserProfile | null> {
  const clean = uid.replace('user-', '').replace(/\D/g, '').slice(-10);
  if (clean && clean.length === 10) {
    const byPhone = await fetchFirestoreUserProfileByPhone(clean);
    if (byPhone) return byPhone;
  }

  const predefined = PREDEFINED_ACCOUNTS.find((a) => a.id === uid);
  if (predefined) return predefined;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error fetching Firestore user profile:', err);
  }
  return null;
}

export async function fetchFirestoreUserProfileByPhone(phoneInput: string): Promise<UserProfile | null> {
  const clean = phoneInput.replace(/\D/g, '').slice(-10);
  if (!clean) return null;

  // a) PREDEFINED_ACCOUNTS first
  const predefined = findPredefinedAccountByPhone(clean);
  if (predefined) return predefined;

  // b) GET /api/users/phone/${clean} from Express server
  try {
    const res = await fetch(`/api/users/phone/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.user) {
        saveLocalRegisteredUser(clean, data.user);
        return data.user;
      }
    }
  } catch (err) {
    console.warn('Error checking user via server API:', err);
  }

  // c) 'idhar_udhar_registered_users' dictionary in safeStorage
  const localMap = getLocalRegisteredUsers();
  if (localMap[clean]) {
    return localMap[clean];
  }

  // d) Firebase Firestore
  try {
    const docId = `user-${clean}`;
    const userDoc = await getDoc(doc(db, 'users', docId));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      saveLocalRegisteredUser(clean, data);
      return data;
    }

    const usersCol = collection(db, 'users');
    const q1 = query(usersCol, where('phone', 'in', [clean, `+91 ${clean}`, `+91${clean}`]));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const data = snap1.docs[0].data() as UserProfile;
      saveLocalRegisteredUser(clean, data);
      return data;
    }
  } catch (err) {
    console.warn('Error querying user by phone in Firestore:', err);
  }

  return null;
}

export async function saveFirestoreUserProfile(profile: UserProfile): Promise<void> {
  const cleanPhone = (profile.phone || '').replace(/\D/g, '').slice(-10);

  // a) Save user into 'idhar_udhar_registered_users' map in safeStorage
  if (cleanPhone) {
    saveLocalRegisteredUser(cleanPhone, profile);
  }

  // b) Send POST /api/users/register to backend server
  try {
    await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch (err) {
    console.warn('Could not sync user registration with server API:', err);
  }

  // c) Save document to Firestore under users/user-${cleanPhone} and users/${profile.id}
  try {
    const docId = cleanPhone ? `user-${cleanPhone}` : profile.id;
    await setDoc(doc(db, 'users', docId), profile, { merge: true });
    if (profile.id && profile.id !== docId) {
      await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
    }
  } catch (err) {
    console.warn('Error saving user profile to Firestore:', err);
  }
}

export async function logoutFirebaseUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {}
}

export { app };
