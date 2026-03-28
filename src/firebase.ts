import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google Sign-In...");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log("Mobile device detected, using signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign-In successful:", result.user.email);
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup wurde blockiert. Bitte erlaube Popups für diese Seite.");
    } else if (error.code === 'auth/operation-not-allowed') {
      alert("Google-Anmeldung ist in Firebase noch nicht aktiviert. Bitte kontaktiere den Support.");
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
