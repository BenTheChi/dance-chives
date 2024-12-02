// src/lib/firebase.ts
import firebase from 'firebase/compat/app';

import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Ensure app is only initialized once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export auth for use in components
export const auth = firebase.auth();

export default firebase;
