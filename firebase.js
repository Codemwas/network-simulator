// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Check if environment variables are set
const hasPlaceholderValue = (value) =>
  typeof value !== 'string' ||
  value.trim().length === 0 ||
  value.includes('your_') ||
  value.includes('YOUR_')

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
}

const canInit =
  !hasPlaceholderValue(firebaseConfig.apiKey) &&
  !hasPlaceholderValue(firebaseConfig.authDomain) &&
  !hasPlaceholderValue(firebaseConfig.projectId) &&
  !hasPlaceholderValue(firebaseConfig.storageBucket) &&
  !hasPlaceholderValue(firebaseConfig.messagingSenderId) &&
  !hasPlaceholderValue(firebaseConfig.appId)

let app = null
let auth = null
let db = null
let realtimeDb = null

if (canInit) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  // Initialize Realtime Database only if database URL is provided
  if (!hasPlaceholderValue(import.meta.env.VITE_FIREBASE_DATABASE_URL)) {
    realtimeDb = getDatabase(app)
  }
}

// MariaDB-backed dashboard: disable RTDB completely to avoid fatal errors
// export const realtimeDb = null

export { auth, db, realtimeDb }
export default app

