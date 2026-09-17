// js/signup.js

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const signupForm = document.getElementById("signupForm");
const message = document.getElementById("message");


signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name =
        document.getElementById("name").value.trim();

    const studentNumber =
        document.getElementById("studentNumber").value.trim();

    const nickname =
        document.getElementById("nickname").value.trim();

    const password =
        document.getElementById("password").value;


    // 학번 검사
    const studentNumberRegex = /^[1-3][0][0-9][0-2][0-9]$/;

    if (!studentNumberRegex.test(studentNumber)) {

        message.textContent =
            "학번은 5자리 숫자로 입력해주세요.";

        return;
    }


    // 별명 길이 검사
    if (nickname.length < 2 || nickname.length > 12) {

        message.textContent =
            "별명은 2~12글자로 입력해주세요.";

        return;
    }


    try {

        // 학번 중복 검사
        const studentRef =
            doc(db, "studentNumbers", studentNumber);

        const studentSnapshot =
            await getDoc(studentRef);


        if (studentSnapshot.exists()) {

            message.textContent =
                "이미 사용 중인 학번입니다.";

            return;
        }


        // 별명 중복 검사
        const nicknameRef =
            doc(db, "nicknames", nickname);

        const nicknameSnapshot =
            await getDoc(nicknameRef);


        if (nicknameSnapshot.exists()) {

            message.textContent =
                "이미 사용 중인 별명입니다.";

            return;
        }


        // Firebase Auth는 이메일 형식이 필요하기 때문에
        // 학번을 이용해서 내부용 이메일을 만듭니다.
        const fakeEmail =
            `${studentNumber}@schoolmeal.local`;


        // Firebase 회원가입
        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                fakeEmail,
                password
            );


        const user =
            userCredential.user;


        // 사용자 정보 저장
        await setDoc(
            doc(db, "users", user.uid),
            {
                name: name,
                studentNumber: studentNumber,
                nickname: nickname,
                role: "student",
                createdAt: serverTimestamp()
            }
        );


        // 학번 중복 방지용
        await setDoc(
            studentRef,
            {
                uid: user.uid
            }
        );


        // 별명 중복 방지용
        await setDoc(
            nicknameRef,
            {
                uid: user.uid
            }
        );


        // 회원가입 완료
        alert("회원가입이 완료되었습니다!");

        location.href = "index.html";


    } catch (error) {

        console.error(error);

        // 오류 종류를 화면에도 표시
        if (error.code === "auth/email-already-in-use") {

            message.textContent =
                "이미 가입된 학번입니다.";

        } else if (error.code === "auth/weak-password") {

            message.textContent =
                "비밀번호는 6자 이상 입력해주세요.";

        } else if (error.code === "auth/invalid-email") {

            message.textContent =
                "잘못된 이메일 형식입니다.";

        } else {

            message.textContent =
                "회원가입 중 오류가 발생했습니다.";

        }
    }

});