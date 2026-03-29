import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * FIREBASE CONFIGURATION
 * -----------------------------------------------------
 * INSTRUCTIONS:
 * 1. Create a project at https://console.firebase.google.com/
 * 2. Add your Web App to get these config values.
 * 3. Add: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc. to your .env
 * -----------------------------------------------------
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
