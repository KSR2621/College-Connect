// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app.js";
import { getAuth } from "firebase/auth.js";
import { getFirestore } from "firebase/firestore.js";
import { getStorage } from "firebase/storage.js";
// Note: Analytics is initialized but not used in the app. It's safe to keep.
import { getAnalytics } from "firebase/analytics.js";

// CRITICAL SECURITY WARNING: Your API keys were publicly exposed.
// 1. Go to your Firebase Console (console.firebase.google.com).
// 2. Find and DELETE the old API key.
// 3. Generate a NEW API key.
// 4. Replace the placeholder values below with your new credentials.
const firebaseConfig = {
 apiKey: "AIzaSyBVuUeutfW6yHzDL4kjV9bInRdpjMgQIHE",
  authDomain: "campus-connect-4ee95.firebaseapp.com",
  projectId: "campus-connect-4ee95",
  storageBucket: "campus-connect-4ee95.appspot.com",
  messagingSenderId: "1051195816127",
  appId: "1:1051195816127:web:598b4cc3a135765a6eee0a",
  measurementId: "G-VWTVTQS5CS"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Firebase services for use in other parts of the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);