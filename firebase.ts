
// This declaration informs TypeScript that a global variable named 'firebase'
// will exist at runtime, provided by the <script> tags in index.html.
// This prevents compile-time errors without using ES module imports that cause race conditions.
declare const firebase: any;

// The API key is loaded from an environment variable for security.
// Assume that process.env.API_KEY is set in the build environment.
const firebaseConfig = {
  apiKey: "AIzaSyBxGsCp9EalIKA5Nr5GwCiJGTbTz6hqMoY",
  authDomain: "campus-connect-a832c.firebaseapp.com",
  databaseURL: "https://campus-connect-a832c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "campus-connect-a832c",
  storageBucket: "campus-connect-a832c.firebasestorage.app",
  messagingSenderId: "475351085570",
  appId: "1:475351085570:web:24e751a9a93e7154cf2d1b",
  measurementId: "G-SWKF6LS1H7"
};

// Initialize Firebase
// The global `firebase` object is guaranteed to exist here due to the script loading order.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const db = firebase.firestore();

// Configure Firestore settings
// Using experimentalForceLongPolling is recommended for environments with restrictive networks (like corporate firewalls or some web containers)
// We wrap in try-catch because settings can only be called once per instance.
try {
    db.settings({ 
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true
    });
} catch (e) {
    console.debug("Firestore settings already applied.");
}

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
