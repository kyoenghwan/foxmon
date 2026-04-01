# Process: Authentication and Age Verification (인증 및 성인인증 프로세스)
* **Description:** 여우알바(Foxmon)의 성인 전용 입구 및 로그인 프로세스
* **Version:** v1.1
* **Last Updated:** 2026-03-30 (관리자 권한 상세화)

### 1. UI/UX 화면 흐름 (Screen Flow)
* `[입구/로그인 화면]`
  - 19세 미만 금지 경고문 및 법적 고지 노출.
  - 로그인 폼 (ID/PW).
  - 본인 인증 버튼 (휴대폰 인증, 아이핀 인증).
* `[본인 인증 모달]` -> `[인증 완료]` -> `[회원가입/로그인 완료]` -> `[메인 홈]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **Entry Gate (성인 인증):** 앱 최초 접속 시 `middleware`가 `age_verified` 쿠키 확인. 없으면 `/age-gate`로 강제 리다이렉트.
2. **인증 수행:** `FA_VERIFY_AGE_MOBILE` 수행 후 성공 시 쿠키 설정 및 `/` 메인 화면 진입.
3. **메인 화면:** 인증된 모든 사용자는 메인 화면 열람 가능. 상단 UI에 [로그인/회원가입] 버튼 노출.
4. **회원가입:**
   - **일반 회원 (`GENERAL`):** 본인인증 후 계정 정보 입력하여 가입.
   - **업체 회원 (`EMPLOYER`):** 본인인증 + **사업자 정보 입력** 필수.
   - **관리자 (`ADMIN`, `SUPER_ADMIN`):** 보안상 일반 가입이 불가능하며, 통합 관리자가 DB에서 권한을 직접 부여함.
5. **로그인:** 가입된 정보를 통해 세션 및 Role 확인. 상단 UI에 권한별 메뉴 노출.

### 3. 연관 데이터베이스 (Touched DB Schema)
* `users` 테이블 (사업자 정보 포함)
* `age_verification_logs` 테이블 (인증 이력)
