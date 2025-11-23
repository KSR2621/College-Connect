
// This declaration informs TypeScript that a global variable named 'firebase'
// will exist at runtime, provided by the <script> tags in index.html.
// This prevents compile-time errors without using ES module imports that cause race conditions.
declare const firebase: any;

// The API key is loaded from an environment variable for security.
// Assume that process.env.API_KEY is set in the build environment.
const firebaseConfig = {
     apiKey: "AIzaSyAx-inII44CzYbx1v39cwd4hcDCpjnPQYs",
  authDomain: "open-gemini-7029y.firebaseapp.com",
  projectId: "open-gemini-7029y",
  storageBucket: "open-gemini-7029y.firebasestorage.app",
  messagingSenderId: "867736048644",
  appId: "1:867736048644:web:bab56f7a3c691b9a8dd151"
};

// Initialize Firebase
// The global `firebase` object is guaranteed to exist here due to the script loading order.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err: any) => {
      if (err.code == 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
          console.warn('Persistence failed: Not supported');
      }
  });

export const auth = firebase.auth();
export { db };
export const storage = firebase.storage();
export const FieldValue = firebase.firestore.FieldValue;
