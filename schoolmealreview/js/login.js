// js/login.js

import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from
    "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const studentNumber =
        document.getElementById("studentNumber").value.trim();

    const password =
        document.getElementById("password").value;


    const email =
        `${studentNumber}@schoolmeal.local`;


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        location.href = "index.html";


    } catch (error) {

        console.error(error);

        message.textContent =
            "학번 또는 비밀번호가 올바르지 않습니다.";

    }

});