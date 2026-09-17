// js/mypage.js

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ========================================
// HTML 요소
// ========================================

const userInfo =
    document.getElementById("userInfo");

const nicknameForm =
    document.getElementById("nicknameForm");

const message =
    document.getElementById("message");


let currentUser = null;
let currentData = null;


// ========================================
// 로그인 상태 확인
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            alert("로그인이 필요합니다.");

            location.href =
                "login.html";

            return;
        }

        currentUser = user;

        try {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );

            if (!snapshot.exists()) {

                userInfo.textContent =
                    "사용자 정보를 찾을 수 없습니다.";

                return;
            }

            currentData =
                snapshot.data();

            showUserInfo();

        } catch (error) {

            console.error(
                "사용자 정보 불러오기 실패:",
                error
            );

            userInfo.textContent =
                "사용자 정보를 불러오지 못했습니다.";
        }
    }
);


// ========================================
// 사용자 정보 표시
// ========================================

function showUserInfo() {

    userInfo.innerHTML = `
        <p>
            <strong>이름</strong>
            <br>
            ${escapeHtml(
                currentData.name || ""
            )}
        </p>

        <p>
            <strong>학번</strong>
            <br>
            ${escapeHtml(
                currentData.studentNumber || ""
            )}
        </p>

        <p>
            <strong>현재 별명</strong>
            <br>
            ${escapeHtml(
                currentData.nickname || ""
            )}
        </p>
    `;
}


// ========================================
// 별명 변경
// ========================================

nicknameForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // --------------------------------
        // 로그인 정보 확인
        // --------------------------------

        if (
            !currentUser ||
            !currentData
        ) {

            message.textContent =
                "로그인 정보를 불러오는 중입니다.";

            return;
        }


        // --------------------------------
        // 입력한 별명
        // --------------------------------

        const input =
            document.getElementById(
                "newNickname"
            );

        const newNickname =
            input.value.trim();


        // --------------------------------
        // 별명 길이 검사
        // --------------------------------

        if (
            newNickname.length < 2 ||
            newNickname.length > 12
        ) {

            message.textContent =
                "별명은 2~12글자로 입력해주세요.";

            return;
        }


        // --------------------------------
        // 현재 별명과 같은 경우
        // --------------------------------

        if (
            newNickname ===
            currentData.nickname
        ) {

            message.textContent =
                "현재 별명과 같은 별명입니다.";

            return;
        }


        try {

            message.textContent =
                "별명을 변경하는 중입니다...";


            const oldNickname =
                currentData.nickname;


            // ========================================
            // 새 별명 문서
            // ========================================

            const newNicknameRef =
                doc(
                    db,
                    "nicknames",
                    newNickname
                );


            // ========================================
            // 새 별명 중복 확인
            // ========================================

            const nicknameSnapshot =
                await getDoc(
                    newNicknameRef
                );


            if (
                nicknameSnapshot.exists()
            ) {

                const nicknameData =
                    nicknameSnapshot.data();


                if (
                    nicknameData.uid !==
                    currentUser.uid
                ) {

                    message.textContent =
                        "이미 사용 중인 별명입니다.";

                    return;
                }
            }


            // ========================================
            // users/{uid} 별명 변경
            // ========================================

            await updateDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    nickname:
                        newNickname
                }
            );


            // ========================================
            // 새 별명 등록
            // ========================================

            await setDoc(
                newNicknameRef,
                {
                    uid:
                        currentUser.uid,

                    updatedAt:
                        serverTimestamp()
                }
            );


            // ========================================
            // 기존 별명 삭제
            // ========================================

            if (
                oldNickname &&
                oldNickname !== newNickname
            ) {

                await deleteDoc(
                    doc(
                        db,
                        "nicknames",
                        oldNickname
                    )
                );
            }


            // ========================================
            // 기존 리뷰 찾기
            // ========================================

            const reviewQuery =
                query(
                    collection(
                        db,
                        "reviews"
                    ),
                    where(
                        "userId",
                        "==",
                        currentUser.uid
                    )
                );


            const reviewSnapshot =
                await getDocs(
                    reviewQuery
                );


            console.log(
                "================================"
            );

            console.log(
                "현재 로그인한 UID:",
                currentUser.uid
            );

            console.log(
                "찾은 내 리뷰 개수:",
                reviewSnapshot.size
            );

            console.log(
                "================================"
            );


            // ========================================
            // 기존 리뷰들의 닉네임 변경
            // ========================================

            let batch =
                writeBatch(db);

            let batchCount = 0;


            for (
                const reviewDocument
                of reviewSnapshot.docs
            ) {

                const reviewData =
                    reviewDocument.data();


                console.log(
                    "리뷰 변경:",
                    reviewDocument.id,
                    "|",
                    reviewData.nickname,
                    "→",
                    newNickname
                );


                batch.update(
                    reviewDocument.ref,
                    {
                        nickname:
                            newNickname,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                batchCount++;


                // --------------------------------
                // 500개마다 저장
                // --------------------------------

                if (
                    batchCount === 500
                ) {

                    await batch.commit();

                    batch =
                        writeBatch(db);

                    batchCount = 0;
                }
            }


            // --------------------------------
            // 남은 리뷰 저장
            // --------------------------------

            if (
                batchCount > 0
            ) {

                await batch.commit();
            }


            console.log(
                "리뷰 닉네임 변경 완료!"
            );


            // ========================================
            // 현재 화면 업데이트
            // ========================================

            currentData.nickname =
                newNickname;


            input.value = "";

            showUserInfo();


            message.textContent =
                "별명이 변경되었습니다.";


        } catch (error) {

            console.error(
                "별명 변경 실패:",
                error
            );

            message.textContent =
                "별명 변경에 실패했습니다.";
        }
    }
);


// ========================================
// HTML 특수문자 방지
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