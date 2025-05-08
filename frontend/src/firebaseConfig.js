import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2VaBH7TSw0FD6a0D8cpY6k-hzSrFa_3Q",
  authDomain: "canvasconnect-7c4f6.firebaseapp.com",
  projectId: "canvasconnect-7c4f6",
  storageBucket: "canvasconnect-7c4f6.firebasestorage.app",
  messagingSenderId: "200498001401",
  appId: "1:200498001401:web:d8a18af53ca78e46dbf928",
  measurementId: "G-LLQBGQCB25"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };