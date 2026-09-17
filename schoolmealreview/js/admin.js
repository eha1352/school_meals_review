// js/admin.js
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ==========================
// 화면 요소
// ==========================

const adminContent =
    document.getElementById("adminContent");

const mealForm =
    document.getElementById("mealForm");

const mealDateInput =
    document.getElementById("mealDate");

const lunchMenu =
    document.getElementById("lunchMenu");

const dinnerMenu =
    document.getElementById("dinnerMenu");

const mealMessage =
    document.getElementById("mealMessage");

const dateGuide =
    document.getElementById("dateGuide");

const userList =
    document.getElementById("userList");


// ==========================
// 한국 날짜
// ==========================

function getKoreaDate(date = new Date()) {

    const parts =
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(date);


    const year =
        parts.find(
            p => p.type === "year"
        ).value;

    const month =
        parts.find(
            p => p.type === "month"
        ).value;

    const day =
        parts.find(
            p => p.type === "day"
        ).value;


    return `${year}-${month}-${day}`;
}


// ==========================
// 날짜 더하기
// ==========================

function addDays(dateString, amount) {

    const date =
        new Date(
            `${dateString}T00:00:00+09:00`
        );


    date.setDate(
        date.getDate() + amount
    );


    return getKoreaDate(date);
}


// ==========================
// 날짜 범위
// ==========================

const today =
    getKoreaDate();

const maxDate =
    addDays(today, 30);


// 날짜 입력 제한

mealDateInput.min =
    today;

mealDateInput.max =
    maxDate;


// 기본 날짜 = 오늘

mealDateInput.value =
    today;


dateGuide.textContent =
    `${today} ~ ${maxDate} 사이의 날짜를 선택할 수 있습니다.`;


// ==========================
// 관리자 권한 확인
// ==========================

onAuthStateChanged(
    auth,
    async (user) => {

        // 로그인 안 함

        if (!user) {

            alert(
                "관리자 로그인이 필요합니다."
            );

            location.href =
                "login.html";

            return;
        }


        try {

            const userSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            // 사용자 정보 없음

            if (!userSnapshot.exists()) {

                alert(
                    "사용자 정보를 찾을 수 없습니다."
                );

                location.href =
                    "index.html";

                return;
            }


            const userData =
                userSnapshot.data();


            // 관리자 아님

            if (
                userData.role !== "admin"
            ) {

                alert(
                    "관리자만 접근할 수 있습니다."
                );

                location.href =
                    "index.html";

                return;
            }


            // 관리자 확인 완료

            adminContent.innerHTML =
                `
                <h2>관리자 페이지</h2>

                <p>
                    관리자 권한이 확인되었습니다.
                </p>
                `;


            // 오늘 급식 불러오기

            await loadMeal(
                mealDateInput.value
            );


            // 회원 목록

            await loadUsers();


        } catch (error) {

            console.error(
                "관리자 확인 오류:",
                error
            );


            adminContent.innerHTML =
                `
                <h2>
                    관리자 확인에 실패했습니다.
                </h2>

                <p>
                    브라우저 Console에서
                    오류를 확인해주세요.
                </p>
                `;

        }

    }
);


// ==========================
// 날짜 변경
// ==========================

mealDateInput.addEventListener(
    "change",
    async () => {

        const selectedDate =
            mealDateInput.value;


        // 날짜가 비어 있음

        if (!selectedDate) {
            return;
        }


        // 범위 확인

        if (
            selectedDate < today ||
            selectedDate > maxDate
        ) {

            mealMessage.textContent =
                "오늘부터 30일 이내의 날짜만 선택할 수 있습니다.";

            mealDateInput.value =
                today;

            return;
        }


        mealMessage.textContent =
            "";


        await loadMeal(
            selectedDate
        );

    }
);


// ==========================
// 급식 저장
// ==========================

mealForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const selectedDate =
            mealDateInput.value;


        // 날짜 확인

        if (!selectedDate) {

            mealMessage.textContent =
                "날짜를 선택해주세요.";

            return;
        }


        // 날짜 범위 확인

        if (
            selectedDate < today ||
            selectedDate > maxDate
        ) {

            mealMessage.textContent =
                "오늘부터 30일 이내의 날짜만 등록할 수 있습니다.";

            return;
        }


        // 중식

        const lunchText =
            lunchMenu.value.trim();


        const lunch =
            lunchText
                ? lunchText
                    .split("\n")
                    .map(item => item.trim())
                    .filter(item => item !== "")
                : [];


        // 석식

        const dinnerText =
            dinnerMenu.value.trim();


        const dinner =
            dinnerText
                ? dinnerText
                    .split("\n")
                    .map(item => item.trim())
                    .filter(item => item !== "")
                : [];


        // 둘 다 비어 있음

        if (
            lunch.length === 0 &&
            dinner.length === 0
        ) {

            mealMessage.textContent =
                "중식 또는 석식 메뉴를 하나 이상 입력해주세요.";

            return;
        }


        try {

            await setDoc(
                doc(
                    db,
                    "meals",
                    selectedDate
                ),
                {
                    date: selectedDate,

                    lunch: lunch,

                    dinner: dinner,

                    updatedAt:
                        serverTimestamp()
                }
            );


            mealMessage.textContent =
                `${selectedDate} 급식이 저장되었습니다.`;


        } catch (error) {

            console.error(
                "급식 저장 오류:",
                error
            );


            mealMessage.textContent =
                "급식 저장에 실패했습니다.";

        }

    }
);


// ==========================
// 기존 급식 불러오기
// ==========================

async function loadMeal(date) {

    lunchMenu.value =
        "";

    dinnerMenu.value =
        "";


    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "meals",
                    date
                )
            );


        // 등록된 급식 없음

        if (!snapshot.exists()) {

            mealMessage.textContent =
                `${date}에는 등록된 급식이 없습니다.`;

            return;
        }


        const meal =
            snapshot.data();


        // 중식

        if (
            Array.isArray(meal.lunch)
        ) {

            lunchMenu.value =
                meal.lunch.join("\n");

        }


        // 석식

        if (
            Array.isArray(meal.dinner)
        ) {

            dinnerMenu.value =
                meal.dinner.join("\n");

        }


        mealMessage.textContent =
            `${date}의 기존 급식을 불러왔습니다.`;


    } catch (error) {

        console.error(
            "급식 불러오기 오류:",
            error
        );


        mealMessage.textContent =
            "급식을 불러오지 못했습니다.";

    }

}


// ==========================
// 회원 목록
// ==========================

async function loadUsers() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        userList.innerHTML =
            "";


        if (snapshot.empty) {

            userList.innerHTML =
                "<p>가입한 회원이 없습니다.</p>";

            return;
        }


        snapshot.forEach(
            (userDocument) => {

                const user =
                    userDocument.data();


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "user-card";


                element.innerHTML =
                    `
                    <strong>
                        ${escapeHtml(
                            user.nickname || ""
                        )}
                    </strong>

                    <br>

                    이름:
                    ${escapeHtml(
                        user.name || ""
                    )}

                    <br>

                    학번:
                    ${escapeHtml(
                        user.studentNumber || ""
                    )}

                    <br>

                    권한:
                    ${escapeHtml(
                        user.role || ""
                    )}
                    `;


                userList.appendChild(
                    element
                );

            }
        );


    } catch (error) {

        console.error(
            "회원 목록 오류:",
            error
        );


        userList.textContent =
            "회원 목록을 불러오지 못했습니다.";

    }

}


// ==========================
// HTML 문자 처리
// ==========================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}