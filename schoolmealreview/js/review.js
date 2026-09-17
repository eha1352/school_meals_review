// js/review.js

console.log("🔥 최신 review.js 실행됨");

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    increment,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ========================================
// URL 날짜
// ========================================

const params =
    new URLSearchParams(
        window.location.search
    );

let selectedDate =
    params.get("date") || getKoreaDate();


// ========================================
// 화면 요소
// ========================================

const types = {

    lunch: {

        form:
            document.getElementById(
                "lunchReviewForm"
            ),

        content:
            document.getElementById(
                "lunchReviewContent"
            ),

        message:
            document.getElementById(
                "lunchReviewMessage"
            ),

        list:
            document.getElementById(
                "lunchReviewList"
            )
    },


    dinner: {

        form:
            document.getElementById(
                "dinnerReviewForm"
            ),

        content:
            document.getElementById(
                "dinnerReviewContent"
            ),

        message:
            document.getElementById(
                "dinnerReviewMessage"
            ),

        list:
            document.getElementById(
                "dinnerReviewList"
            )
    }
};


// ========================================
// 현재 사용자
// ========================================

let currentUser = null;

let currentUserData = null;


// ========================================
// 한국 날짜
// ========================================

function getKoreaDate() {

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(
            new Date()
        );


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


// ========================================
// 오늘인지 확인
// ========================================

function isToday() {

    return selectedDate ===
        getKoreaDate();
}


// ========================================
// 로그인 상태
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser =
            user;


        if (!user) {

            currentUserData =
                null;

        } else {

            try {

                const snapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );


                if (
                    snapshot.exists()
                ) {

                    currentUserData =
                        snapshot.data();

                } else {

                    currentUserData =
                        null;
                }

            } catch (error) {

                console.error(
                    "사용자 정보 오류:",
                    error
                );

                currentUserData =
                    null;
            }
        }


        updateReviewForms();

        await loadReviews("lunch");

        await loadReviews("dinner");
    }
);


// ========================================
// 리뷰 작성 가능 여부
// ========================================

function updateReviewForms() {

    const today =
        isToday();


    for (
        const type in types
    ) {

        const item =
            types[type];


        if (!item.form) {
            continue;
        }


        // 로그인하지 않은 경우
        if (!currentUser) {

            item.form.style.display =
                "none";

            item.message.textContent =
                "리뷰를 작성하려면 로그인해주세요.";

            continue;
        }


        // 과거 / 미래
        if (!today) {

            item.form.style.display =
                "none";


            if (
                selectedDate <
                getKoreaDate()
            ) {

                item.message.textContent =
                    "지난 날짜의 리뷰는 읽기만 가능합니다.";

            } else {

                item.message.textContent =
                    "미래 날짜의 리뷰는 아직 작성할 수 없습니다.";
            }

            continue;
        }


        // 오늘
        item.form.style.display =
            "block";

        item.message.textContent =
            "";
    }
}


// ========================================
// 리뷰 작성
// ========================================

for (
    const type in types
) {

    const item =
        types[type];


    if (!item.form) {
        continue;
    }


    item.form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "로그인해주세요."
                );

                return;
            }


            // 오늘만 작성 가능
            if (!isToday()) {

                item.message.textContent =
                    "리뷰는 당일에만 작성할 수 있습니다.";

                return;
            }


            const content =
                item.content.value.trim();


            if (!content) {

                item.message.textContent =
                    "리뷰 내용을 입력해주세요.";

                return;
            }


            try {

                const reviewId =
                    `${selectedDate}_${type}_${currentUser.uid}`;


                const reviewRef =
                    doc(
                        db,
                        "reviews",
                        reviewId
                    );


                const oldReview =
                    await getDoc(
                        reviewRef
                    );


                // 이미 리뷰가 있는 경우
                if (
                    oldReview.exists()
                ) {

                    item.message.textContent =
                        "이미 작성한 리뷰가 있습니다. 기존 리뷰를 수정해주세요.";

                    return;
                }


                await setDoc(
                    reviewRef,
                    {

                        mealDate:
                            selectedDate,

                        mealType:
                            type,

                        userId:
                            currentUser.uid,

                        nickname:
                            currentUserData?.nickname ||
                            "익명",

                        role:
                            currentUserData?.role ||
                            "student",

                        content:
                            content,

                        likes:
                            0,

                        dislikes:
                            0,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );


                item.content.value =
                    "";


                item.message.textContent =
                    "리뷰가 작성되었습니다.";


                await loadReviews(
                    type
                );


            } catch (error) {

                console.error(
                    "리뷰 작성 오류:",
                    error
                );


                item.message.textContent =
                    "리뷰 작성에 실패했습니다.";
            }
        }
    );
}


// ========================================
// 리뷰 불러오기
// ========================================

async function loadReviews(
    type
) {

    const item =
        types[type];


    if (!item.list) {
        return;
    }


    try {

        const reviewQuery =
            query(
                collection(
                    db,
                    "reviews"
                ),

                where(
                    "mealDate",
                    "==",
                    selectedDate
                )
            );


        const snapshot =
            await getDocs(
                reviewQuery
            );


        const reviews = [];


        snapshot.forEach(
            (reviewDocument) => {

                const review =
                    reviewDocument.data();


                if (
                    review.mealType ===
                    type
                ) {

                    reviews.push({

                        id:
                            reviewDocument.id,

                        ...review
                    });
                }
            }
        );


        // 최신순
        reviews.sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.toMillis
                        ? a.createdAt.toMillis()
                        : 0;


                const bTime =
                    b.createdAt?.toMillis
                        ? b.createdAt.toMillis()
                        : 0;


                return bTime - aTime;
            }
        );


        // 리뷰 없음
        if (
            reviews.length === 0
        ) {

            item.list.innerHTML =
                `
                <p>
                    아직 ${type === "lunch" ? "중식" : "석식"} 리뷰가 없습니다.
                </p>
                `;

            return;
        }


        item.list.innerHTML =
            "";


        reviews.forEach(
            (review) => {

                const reviewElement =
                    document.createElement(
                        "div"
                    );


                reviewElement.className =
                    "review";


                // 관리자 여부
                const isAdmin =
                    review.role ===
                    "admin";


                // 본인 리뷰
                const isMine =
                    currentUser &&
                    review.userId ===
                    currentUser.uid;


                // 과거 리뷰인지
                const pastReview =
                    selectedDate <
                    getKoreaDate();


                // 관리자라면 삭제 가능
                const canDelete =
                    currentUserData &&
                    currentUserData.role ===
                    "admin";


                // 관리자 닉네임 노란색
                const nicknameStyle =
                    isAdmin
                        ? "color: #ffd43b;"
                        : "";


                reviewElement.innerHTML =
                    `

                    <h3 style="${nicknameStyle}">

                        ${escapeHtml(
                            review.nickname ||
                            "익명"
                        )}

                        ${
                            isAdmin
                                ? " ⭐"
                                : ""
                        }

                    </h3>


                    <p>
                        ${escapeHtml(
                            review.content ||
                            ""
                        )}
                    </p>


                    <div>

                        <button
                            class="like-button"
                            data-id="${review.id}"
                            ${pastReview && !canDelete ? "disabled" : ""}
                        >
                            👍
                            ${review.likes || 0}
                        </button>


                        <button
                            class="dislike-button"
                            data-id="${review.id}"
                            ${pastReview && !canDelete ? "disabled" : ""}
                        >
                            👎
                            ${review.dislikes || 0}
                        </button>


                        ${
                            isMine && isToday()
                                ?

                                `
                                <button
                                    class="edit-button"
                                    data-id="${review.id}"
                                    data-type="${type}"
                                >
                                    수정
                                </button>
                                `

                                :

                                ""
                        }


                        ${
                            canDelete
                                ?

                                `
                                <button
                                    class="delete-button"
                                    data-id="${review.id}"
                                    data-type="${type}"
                                >
                                    삭제
                                </button>
                                `

                                :

                                ""
                        }

                    </div>
                    `;


                item.list.appendChild(
                    reviewElement
                );
            }
        );


        // ========================================
        // 좋아요
        // ========================================

        item.list
            .querySelectorAll(
                ".like-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            vote(
                                button.dataset.id,
                                "likes"
                            );
                        }
                    );
                }
            );


        // ========================================
        // 싫어요
        // ========================================

        item.list
            .querySelectorAll(
                ".dislike-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            vote(
                                button.dataset.id,
                                "dislikes"
                            );
                        }
                    );
                }
            );


        // ========================================
        // 수정
        // ========================================

        item.list
            .querySelectorAll(
                ".edit-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            editReview(
                                button.dataset.id,
                                button.dataset.type
                            );
                        }
                    );
                }
            );


        // ========================================
        // 관리자 삭제
        // ========================================

        item.list
            .querySelectorAll(
                ".delete-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            deleteReview(
                                button.dataset.id,
                                button.dataset.type
                            );
                        }
                    );
                }
            );


    } catch (error) {

        console.error(
            "리뷰 불러오기 오류:",
            error
        );


        item.list.innerHTML =
            `
            <p>
                리뷰를 불러오지 못했습니다.
            </p>
            `;
    }
}


// ========================================
// 리뷰 수정
// ========================================

async function editReview(
    reviewId,
    type
) {

    // 오늘이 아니면 수정 불가
    if (!isToday()) {

        alert(
            "리뷰는 작성한 당일에만 수정할 수 있습니다."
        );

        return;
    }


    if (!currentUser) {

        alert(
            "로그인해주세요."
        );

        return;
    }


    try {

        const reviewRef =
            doc(
                db,
                "reviews",
                reviewId
            );


        const snapshot =
            await getDoc(
                reviewRef
            );


        if (!snapshot.exists()) {

            alert(
                "리뷰를 찾을 수 없습니다."
            );

            return;
        }


        const review =
            snapshot.data();


        // 본인 리뷰인지 확인
        if (
            review.userId !==
            currentUser.uid
        ) {

            alert(
                "본인의 리뷰만 수정할 수 있습니다."
            );

            return;
        }


        const newContent =
            prompt(
                "수정할 리뷰 내용을 입력하세요.",
                review.content
            );


        if (
            newContent === null
        ) {

            return;
        }


        const trimmedContent =
            newContent.trim();


        if (!trimmedContent) {

            alert(
                "리뷰 내용을 입력해주세요."
            );

            return;
        }


        await updateDoc(
            reviewRef,
            {

                content:
                    trimmedContent,

                updatedAt:
                    serverTimestamp()
            }
        );


        alert(
            "리뷰가 수정되었습니다."
        );


        await loadReviews(
            type
        );


    } catch (error) {

        console.error(
            "리뷰 수정 오류:",
            error
        );


        alert(
            "리뷰 수정에 실패했습니다."
        );
    }
}


// ========================================
// 관리자 리뷰 삭제
// ========================================

async function deleteReview(
    reviewId,
    type
) {

    // 관리자 확인
    if (
        !currentUser ||
        !currentUserData ||
        currentUserData.role !== "admin"
    ) {

        alert(
            "관리자만 리뷰를 삭제할 수 있습니다."
        );

        return;
    }


    const confirmed =
        confirm(
            "정말 이 리뷰를 삭제하시겠습니까?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const reviewRef =
            doc(
                db,
                "reviews",
                reviewId
            );


        const snapshot =
            await getDoc(
                reviewRef
            );


        if (!snapshot.exists()) {

            alert(
                "이미 삭제된 리뷰입니다."
            );

            await loadReviews(
                type
            );

            return;
        }


        await deleteDoc(
            reviewRef
        );


        alert(
            "리뷰가 삭제되었습니다."
        );


        await loadReviews(
            type
        );


    } catch (error) {

        console.error(
            "리뷰 삭제 오류:",
            error
        );


        alert(
            "리뷰 삭제에 실패했습니다."
        );
    }
}


// ========================================
// 좋아요 / 싫어요
// ========================================

async function vote(
    reviewId,
    type
) {

    if (!currentUser) {

        alert(
            "로그인해주세요."
        );

        return;
    }


    // 과거 리뷰에는 평가할 수 없음
    if (!isToday()) {

        alert(
            "지난 날짜의 리뷰에는 평가할 수 없습니다."
        );

        return;
    }


    try {

        const voteId =
            `${reviewId}_${currentUser.uid}`;


        const voteRef =
            doc(
                db,
                "reviewVotes",
                voteId
            );


        const voteSnapshot =
            await getDoc(
                voteRef
            );


        // 이미 투표함
        if (
            voteSnapshot.exists()
        ) {

            alert(
                "이 리뷰에는 이미 평가했습니다."
            );

            return;
        }


        // 투표 기록
        await setDoc(
            voteRef,
            {

                reviewId:
                    reviewId,

                userId:
                    currentUser.uid,

                type:
                    type,

                createdAt:
                    serverTimestamp()
            }
        );


        // 리뷰 숫자 증가
        await updateDoc(
            doc(
                db,
                "reviews",
                reviewId
            ),
            {

                [type]:
                    increment(1)
            }
        );


        await loadReviews(
            getCurrentMealType(
                reviewId
            )
        );


    } catch (error) {

        console.error(
            "투표 오류:",
            error
        );


        alert(
            "처리 중 오류가 발생했습니다."
        );
    }
}


// ========================================
// 리뷰 ID로 식사 종류 찾기
// ========================================

function getCurrentMealType(
    reviewId
) {

    if (
        reviewId.includes(
            "_lunch_"
        )
    ) {

        return "lunch";
    }


    return "dinner";
}


// ========================================
// HTML 문자 처리
// ========================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text);


    return div.innerHTML;
}