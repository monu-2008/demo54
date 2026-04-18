import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAUBOLBLdbVIwUTXmBz6v8wMzX35Kg8Xuo",
  authDomain: "racecomputers-e2850.firebaseapp.com",
  projectId: "racecomputers-e2850",
  storageBucket: "racecomputers-e2850.firebasestorage.app",
  messagingSenderId: "1013982271144",
  appId: "1:1013982271144:web:add2050cc122c381b9d49d",
  databaseURL: "https://racecomputers-e2850-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Always show account selection popup
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
