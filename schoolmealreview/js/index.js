import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ==========================
// 화면 요소
// ==========================

const todayElement =
    document.getElementById("today");

const todayMeal =
    document.getElementById("todayMeal");

const loginLink =
    document.getElementById("loginLink");

const logoutButton =
    document.getElementById("logoutButton");

const adminLink =
    document.getElementById("adminLink");


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
        parts.find(p => p.type === "year").value;

    const month =
        parts.find(p => p.type === "month").value;

    const day =
        parts.find(p => p.type === "day").value;

    return `${year}-${month}-${day}`;
}


// ==========================
// 날짜 더하기
// ==========================

function addDays(dateString, amount) {

    const date =
        new Date(`${dateString}T00:00:00+09:00`);

    date.setDate(
        date.getDate() + amount
    );

    return getKoreaDate(date);
}


// ==========================
// 오늘 급식
// ==========================

async function loadTodayMeal() {

    const today =
        getKoreaDate();

    todayElement.textContent =
        formatDate(today);


    try {

        const snapshot =
            await getDoc(
                doc(db, "meals", today)
            );


        if (!snapshot.exists()) {

            todayMeal.innerHTML =
                `
                <p>
                    오늘 등록된 급식이 없습니다.
                </p>
                `;

            return;
        }


        const meal =
            snapshot.data();


        todayMeal.innerHTML =
            `
            <div class="meal-box">

                <h3>🍚 중식</h3>

                ${createMenuList(meal.lunch)}

            </div>


            <div class="meal-box">

                <h3>🌙 석식</h3>

                ${createMenuList(meal.dinner)}

            </div>


            <a href="meal.html?date=${today}">
                <button>
                    오늘 리뷰 보기
                </button>
            </a>
            `;


    } catch (error) {

        console.error(
            "오늘 급식 오류:",
            error
        );

        todayMeal.textContent =
            "급식 정보를 불러오지 못했습니다.";
    }
}



// ==========================
// 메뉴 목록
// ==========================

function createMenuList(menu) {

    if (!menu || menu.length === 0) {

        return `
            <p>등록된 메뉴가 없습니다.</p>
        `;
    }


    return `
        <ul>
            ${menu.map(item =>
                `<li>${escapeHtml(item)}</li>`
            ).join("")}
        </ul>
    `;
}




// ==========================
// 날짜 표시
// ==========================

function formatDate(dateString) {

    const date =
        new Date(
            `${dateString}T00:00:00+09:00`
        );


    const weekdays =
        [
            "일",
            "월",
            "화",
            "수",
            "목",
            "금",
            "토"
        ];


    return `
        ${date.getFullYear()}년
        ${date.getMonth() + 1}월
        ${date.getDate()}일
        (${weekdays[date.getDay()]})
    `;
}


// ==========================
// 로그인 상태
// ==========================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            loginLink.style.display =
                "inline";

            logoutButton.style.display =
                "none";

            adminLink.style.display =
                "none";

            return;
        }


        loginLink.style.display =
            "none";

        logoutButton.style.display =
            "inline";


        try {

            const snapshot =
                await getDoc(
                    doc(db, "users", user.uid)
                );


            if (
                snapshot.exists() &&
                snapshot.data().role === "admin"
            ) {

                adminLink.style.display =
                    "inline";
            }

        } catch (error) {

            console.error(
                "사용자 정보 오류:",
                error
            );
        }

    }
);


// ==========================
// 로그아웃
// ==========================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            const {
                signOut
            } = await import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
            );


            await signOut(auth);

            location.reload();


        } catch (error) {

            console.error(error);

            alert(
                "로그아웃에 실패했습니다."
            );

        }

    }
);


// ==========================
// HTML 문자 처리
// ==========================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


// 실행

loadTodayMeal();