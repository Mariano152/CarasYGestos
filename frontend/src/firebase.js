// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {

  apiKey: "AIzaSyDNfnkSToxAdqpu3HUc1hT8jNssS2sckO8",
  authDomain: "carasygestos-ab688.firebaseapp.com",
  databaseURL: "https://carasygestos-ab688-default-rtdb.firebaseio.com",
  projectId: "carasygestos-ab688",
  storageBucket: "carasygestos-ab688.firebasestorage.app",
  messagingSenderId: "756634739378",
  appId: "1:756634739378:web:c82a9780045f3d1b805fab",
  measurementId: "G-8RWCCZHM8N"

};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default database;
