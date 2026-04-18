import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWI1NryPadVGdHggTyiRyHITObwpEVduw",
  authDomain: "nutritechweb.firebaseapp.com",
  projectId: "nutritechweb",
  storageBucket: "nutritechweb.firebasestorage.app",
  messagingSenderId: "830499235425",
  appId: "1:830499235425:web:b9114439bc50e7a00e2c20"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs };