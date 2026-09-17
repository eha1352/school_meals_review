import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ==========================
// 화면 요소
// ==========================

const mealDate =
    document.getElementById("mealDate");

const lunchMenu =
    document.getElementById("lunchMenu");

const dinnerMenu =
    document.getElementById("dinnerMenu");


// ==========================
// 한국 날짜
// ==========================

function getKoreaDate() {

    const parts =
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date());


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
// URL에서 날짜 가져오기
// ==========================

const params =
    new URLSearchParams(
        window.location.search
    );


const selectedDate =
    params.get("date") || getKoreaDate();


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
// 급식 불러오기
// ==========================

async function loadMeal() {

    mealDate.textContent =
        formatDate(selectedDate);


    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "meals",
                    selectedDate
                )
            );


        if (!snapshot.exists()) {

            lunchMenu.innerHTML =
                "<li>등록된 중식이 없습니다.</li>";

            dinnerMenu.innerHTML =
                "<li>등록된 석식이 없습니다.</li>";

            return;
        }


        const meal =
            snapshot.data();


        // ==========================
        // 중식
        // ==========================

        lunchMenu.innerHTML =
            "";


        if (
            !meal.lunch ||
            meal.lunch.length === 0
        ) {

            lunchMenu.innerHTML =
                "<li>등록된 중식이 없습니다.</li>";

        } else {

            meal.lunch.forEach(
                menu => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        menu;

                    lunchMenu.appendChild(
                        li
                    );

                }
            );

        }


        // ==========================
        // 석식
        // ==========================

        dinnerMenu.innerHTML =
            "";


        if (
            !meal.dinner ||
            meal.dinner.length === 0
        ) {

            dinnerMenu.innerHTML =
                "<li>등록된 석식이 없습니다.</li>";

        } else {

            meal.dinner.forEach(
                menu => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        menu;

                    dinnerMenu.appendChild(
                        li
                    );

                }
            );

        }


    } catch (error) {

        console.error(
            "급식 불러오기 오류:",
            error
        );

        lunchMenu.innerHTML =
            "<li>급식을 불러오지 못했습니다.</li>";

        dinnerMenu.innerHTML =
            "<li>급식을 불러오지 못했습니다.</li>";

    }

}



// ==========================
// 날짜 이동
// ==========================

const prevDayButton =
    document.getElementById("prevDayButton");

const nextDayButton =
    document.getElementById("nextDayButton");

const datePicker =
    document.getElementById("datePicker");


// 날짜를 Date 객체로 변환
function getDateObject(dateString) {
    return new Date(
        `${dateString}T00:00:00+09:00`
    );
}


// Date 객체를 YYYY-MM-DD로 변환
function dateToString(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 날짜 이동
function moveDate(days) {

    const date =
        getDateObject(selectedDate);

    date.setDate(
        date.getDate() + days
    );

    const newDate =
        dateToString(date);

    window.location.href =
        `meal.html?date=${newDate}`;
}


// 이전 날짜
prevDayButton.addEventListener(
    "click",
    () => {
        moveDate(-1);
    }
);


// 다음 날짜
nextDayButton.addEventListener(
    "click",
    () => {
        moveDate(1);
    }
);


// 날짜 선택
datePicker.value = selectedDate;

datePicker.addEventListener(
    "change",
    () => {

        if (!datePicker.value) {
            return;
        }

        window.location.href =
            `meal.html?date=${datePicker.value}`;
    }
);


// 실행
loadMeal();