// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7tfJCe524Wj1k5thzJU75vOFwz6OtNpM",
  authDomain: "afghan-travel-agency.firebaseapp.com",
  projectId: "afghan-travel-agency",
  storageBucket: "afghan-travel-agency.appspot.com",
  messagingSenderId: "611750824045",
  appId: "1:611750824045:web:1189e0eac87c23adb39764",
  measurementId: "G-DZJSQXP9GF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication, Firestore, and Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
