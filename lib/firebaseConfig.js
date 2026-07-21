// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGyDIYZSJxZpnhgPR81z2IoQLHE5EVkO8",
  authDomain: "mtt-wears-2bf36.firebaseapp.com",
  projectId: "mtt-wears-2bf36",
  storageBucket: "mtt-wears-2bf36.firebasestorage.app",
  messagingSenderId: "41480625899",
  appId: "1:41480625899:web:95779308fd7b5de615e8ae",
};

// Initialize Firebase App (Singleton Pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);