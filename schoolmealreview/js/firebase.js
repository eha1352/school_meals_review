import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyC29tyM6vuzk8R8PPGnmHB_m1ZITGW-kgc",
    authDomain: "schoolmealreview.firebaseapp.com",
    projectId: "schoolmealreview",
    storageBucket: "schoolmealreview.firebasestorage.app",
    messagingSenderId: "318059396536",
    appId: "1:318059396536:web:350608568bea07d097e34d",
    measurementId: "G-PE55LFKMD9"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);