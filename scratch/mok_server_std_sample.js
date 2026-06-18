<USER_REQUEST>
여기 있구만

const express = require('express');
const session = require('express-session');
const axios = require("axios");
const bodyParser = require('body-parser');
const urlencode = require('urlencode');

/* 암호화 라이브러리 mok_Key_Manager */
let mobileOK;mobileOK
try {
    mobileOK= require("./mok_Key_Manager_v1.0.3.js"); 
} catch (error)  {
    console.log('mok_Key_Manager 파일의 경로가 올바르지 않습니다.');
}
/* 1. express 서버 설정 */
const app = express();

/* 1-1 포트(port) 설정 */
const port = 8080 ;

/* 1-2 루트(root)패키지의 정적파일을 읽기위한 설정 */
app.use(express.static('./'));

/* 1-3 Content-type : plain-text 설정 */
app.use(bodyParser.text());

/* 1-4 request-body 데이터 urlencode 설정 */
app.use(bodyParser.urlencoded({ extended: true }));

/* 1-5 session 설정 */
app.use(session({
    secret:uuid(),
    resave:false,
    saveUninitialized: false
}));

/* 1-5 본인확인 Node.js 서버 실행 */
app.listen(port, () => {
    console.log(`App listening at Port : ${port}`);
});

// 본인확인 인증결과를 Redirect로 설정하고 뷰(view)를 ejs로 이용시 
// app.set('view engine', 'ejs');


/* 2. 본인확인 인증결과 경로설정 */
/* 2-1 본인확인 인증결과 API 요청 URL */
const MOK_RESULT_REQUEST_URL = 'https://scert.mobile-ok.com/gui/service/v1/result/request';  // 개발
// const MOK_RESULT_REQUEST_URL = 'https://cert.mobile-ok.com/gui/service/v1/result/request';  // 운영

/* 2-1 본인확인 Node.js서버 매핑 URL */
const requestUri = 'https://본인확인 요청 URL/mok/mok_std_request';  // mok 인증 요청 URI  
const resultUri = 'https://본인확인 요청 URL/mok/mok_std_result';  // mok 결과 요청 URI


/* 2-3 결과 수신 후 전달 URL 설정 - "https://" 포함한 URL 입력 */
/* 결과 전달 URL 내에 개인정보 포함을 절대 금지합니다.*/
const resultUrl = 'https://이용기관URL/mok/mok_std_result'; 

/* 3. 본인확인 서비스 API 설정 */
/* 3-1 키
<truncated 10614 bytes>
Date = year + mon + date + hour + min + sec;

    return reqDate;
}

/* 본인확인 서버 통신 예제 함수 */
function getOldTime(oldTime) {
    let year = oldTime.getFullYear();
    let mon = oldTime.getMonth() + 1;
    let date = oldTime.getDate();

    let hour = oldTime.getHours();
    let min = oldTime.getMinutes()+ 10;
    let sec = oldTime.getSeconds();

    if (min >= 60) {
        min = min - 60;

        hour = hour + 1;
    }
    if (hour >= 24) {
        hour = hour - 24;

        date = date + 1;
    }
    if (date > new Date(year, mon, 0).getDate()) {
        date = date - (new Date(year, mon, 0).getDate());

        mon = mon + 1;
    }
    if (mon >= 13) {
        mon = mon - 12;

        year = year + 1;
    }

    mon = mon < 10 ? `0${mon}` : `${mon}`;
    date = date < 10 ? `0${date}` : `${date}`;
    hour = hour < 10 ? `0${hour}` : `${hour}`;
    min = min < 10 ? `0${min}` : `${min}`;
    sec = sec < 10 ? `0${sec}` : `${sec}`;

    const reqDate = year + mon + date + hour + min + sec;

    return reqDate;
}

async function sendPost(targetUrl, encryptMOKKeyToken) {
    try {
        let responseData = await axios ({
            method : 'post',
            url : targetUrl,
            data : encryptMOKKeyToken
        });

        return responseData.data;
    } catch (AxiosError) {
        console.log('본인확인 서버 통신URL이 잘 못 되었습니다.');
    }
}

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-18T01:25:35+09:00.

The user's current state is as follows:
Active Document: d:\Antigravity\Foxmon\lib\kmc-service.ts (LANGUAGE_TYPESCRIPT)
Cursor is on line: 36
Other open documents:
- d:\Antigravity\Foxmon\.env.local (LANGUAGE_UNSPECIFIED)
- d:\Antigravity\Foxmon\lib\kmc-service.ts (LANGUAGE_TYPESCRIPT)
- d:\Antigravity\Foxmon\scripts\create-guest-viewer.sql (LANGUAGE_SQL)
- d:\Antigravity\Foxmon\src\components\auth\LoginForm.tsx (LANGUAGE_TSX)
- d:\Antigravity\Foxmon\src\components\auth\AgeVerificationBox.tsx (LANGUAGE_TSX)
</ADDITIONAL_METADATA>