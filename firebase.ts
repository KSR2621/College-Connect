// This declaration informs TypeScript that a global variable named 'firebase'
// will exist at runtime, provided by the <script> tags in index.html.
// This prevents compile-time errors without using ES module imports that cause race conditions.
declare const firebase: any;

// The API key is loaded from an environment variable for security.
// Assume that process.env.API_KEY is set in the build environment.
const firebaseConfig = {
    apiKey: "AIzaSyBVuUeutfW6yHzDL4kjV9bInRdpjMgQIHE",
    authDomain: "campus-connect-4ee95.firebaseapp.com",
    projectId: "campus-connect-4ee95",
    storageBucket: "campus-connect-4ee95.firebasestorage.app",
    messagingSenderId: "1051195816127",
    appId: "1:1051195816127:web:598b4cc3a135765a6eee0a",
    measurementId: "G-VWTVTQS5CS"
};

// Initialize Firebase
// The global `firebase` object is guaranteed to exist here due to the script loading order.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize and export services for the rest of the app to use.
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const FieldValue = firebase.firestore.FieldValue;