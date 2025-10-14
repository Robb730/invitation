// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCM7pUbClTcAlWD1rnE4PCSSFrxUY6vJBM",
  authDomain: "simplelogin-7b738.firebaseapp.com",
  projectId: "simplelogin-7b738",
  storageBucket: "simplelogin-7b738.firebasestorage.app",
  messagingSenderId: "662582329079",
  appId: "1:662582329079:web:7aebc1fe4218bbf6ce5df2",
  measurementId: "G-KXHCDWLQ5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const db = getFirestore(app);
export {app, auth};