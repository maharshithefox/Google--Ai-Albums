import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config loaded from firebase-applet-config.json
const firebaseConfig = {
  projectId: "authorscorner",
  appId: "1:357432866035:web:9a025774676e51d04cf386",
  apiKey: "AIzaSyCGmM1zESX3N4AnJ_dPoth2yaS5bugg7Js",
  authDomain: "authorscorner.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-googleaistudioal-5718528e-23a4-4e1e-a34f-9df81359f53c",
  storageBucket: "authorscorner.firebasestorage.app",
  messagingSenderId: "357432866035",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Standard scopes
googleProvider.addScope("profile");
googleProvider.addScope("email");

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};

export type { FirebaseUser };
