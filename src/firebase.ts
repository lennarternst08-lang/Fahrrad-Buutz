import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google Sign-In...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-In successful:", result.user.email);
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup wurde blockiert. Bitte erlaube Popups für diese Seite in den Safari/Browser-Einstellungen.");
    } else if (error.code === 'auth/operation-not-allowed') {
      alert("Google-Anmeldung ist in Firebase noch nicht aktiviert. Bitte kontaktiere den Support.");
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Domain nicht autorisiert: " + window.location.hostname + "\nBitte stelle sicher, dass exakt diese Domain in Firebase eingetragen ist.");
    } else {
      alert("Fehler bei der Anmeldung: " + error.message);
    }
    throw error; // Rethrow so the calling function knows it failed
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
