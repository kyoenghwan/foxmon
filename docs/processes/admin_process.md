# Process: Admin
* **Description:** 최고 관리자의 전체 활동 조회 및 플랫폼 제어판
* **Version:** 1.0
* **Last Updated:** 2026-04-02

### 1. 프로세스 시퀀스 (FA_ADMIN_USER_FLOW)
   - **GET_ALL_USERS**: `QA_GET_ALL_USERS`를 호출하여 모든 회원의 상태(나이 인증 여부, 가입일, 롤)를 종합적으로 받아옵니다.
   - (추후 추가될 OA를 통해 강제 탈퇴, 권한 부여 등을 확장 가능)
