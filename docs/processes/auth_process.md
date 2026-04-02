# Process: Auth
* **Description:** 사용자 인증, 회원가입, 세션 관리 및 비밀번호 찾기 등 인증 도메인의 거시적 전체 흐름
* **Version:** v1.0
* **Last Updated:** 2026-04-02

### 1. UI/UX 화면 흐름 (Screen Flow)
* `[로그인 버튼 클릭]` -> `[로그인 폼 UI]` -> (성공 시) `[Context 유저 세팅 및 홈 리다이렉트]`
* `[회원가입 탭 클릭]` -> `[회원가입 폼 UI]` -> `[본인 인증 및 약관 선택]` -> (성공 시) `[로그인 탭으로 이동]`
* `[비밀번호 찾기 클릭]` -> `[사용자 정보(이름, 번호) 입력]` -> `[새 비밀번호 입력]` -> (성공 시) `[로그인 탭으로 이동]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **로그인 시도:**
   - 프레임워크 트리거: `Credentials(NextAuth)` 실행
   - `FA_LOGIN_FLOW` 호출 (아이디/비밀번호 검증 및 정보 조회)
   - 결과(성공): `NextAuth` Session에 토큰 발급
2. **회원가입 시도:** 
   - 프레임워크 트리거: 폼 Submit 
   - `FA_REGISTER_FLOW` 호출 (ID/닉네임 중복체크 후 계정 DB Insert)
3. **사용자 환경설정(Profile Update):** 
   - `FA_USER_SETTINGS_FLOW` 호출 (정보 업데이트 OA 실행 후 성공 리턴)

### 3. 연관 데이터베이스 (Touched DB Schema)
* `users` 테이블 (참조: `docs/db/users_schema.md`) - 정보 조회 및 생성용
