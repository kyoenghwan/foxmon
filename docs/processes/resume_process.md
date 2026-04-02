# Process: Resume (이력서)
* **Description:** 구직자(Seeker)의 이력서 작성, 삭제, 조회 및 공개 여부 활성화 프로세스
* **Version:** 1.0
* **Last Updated:** 2026-04-02

### 1. UI/UX 화면 흐름 (Screen Flow)
* **이력서 관리:** `[마이페이지]` -> `[이력서 관리 탭]` -> `[보유 이력서 리스트 출력]`
* **이력서 신규 작성:** `[새 이력서 작성 폼]` -> `[기본 정보(Profile) 자동 로드]` -> `[데이터 기입]` -> `[저장]`
* **이력서 상태 전환:** `[리스트 내 토글 스위치]` -> `[공개/비공개 전환 반영]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **이력서 관리 통합 (FA_MANAGE_RESUME_FLOW):**
   - 역할: Action Type에 따라 CUD 및 R(기본 템플릿 포함) 액션을 중앙 제어합니다.
   - **GET (목록 조회)**
     - 실행 (QA): 사용자 권한 및 필터에 맞는 이력서 긁어오기 (`QA_GET_USER_RESUMES`)
   - **GET_DEFAULTS (새 작성 기본값 불러오기)**
     - 실행 (QA): 회원가입 시 기입한 유저 프로필 정보를 Auth 도메인에서 가져와 기본값 설정 (`QA_GET_USER_PROFILE`)
   - **SAVE (업서트 - 생성/수정)**
     - 검증 (RA): FA 내부 내재화 (타이틀 입력 여부 등 기본적인 검증)
     - 실행 (OA): 이력서 DB에 레코드 삽입/갱신 (`OA_UPSERT_RESUME`)
   - **DELETE (삭제)**
     - 실행 (OA): 이력서 소유주 확인 후 완전 삭제 (`OA_DELETE_RESUME`)
   - **TOGGLE_PUBLIC (공개 상태 전환)**
     - 실행 (OA): 기업 회원이 열람할 수 있도록 상태 갱신 (`OA_TOGGLE_RESUME_PUBLIC`)

### 3. 연관 데이터베이스 (Touched DB Schema)
* `resumes` 테이블 (참조: `docs/db/users_schema.md` 내 resumes 설명란)
* `users` 테이블 (Profile 연동)
