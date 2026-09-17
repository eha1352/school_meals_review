// js/auth.js

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    doc,
    getDoc
} from
    "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


export function checkLogin(callback) {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            callback(null, null);

            return;
        }


        const userRef =
            doc(db, "users", user.uid);

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            callback(user, null);

            return;
        }


        callback(
            user,
            snapshot.data()
        );

    });

}


export async function logout() {

    await signOut(auth);

    location.href = "index.html";

}