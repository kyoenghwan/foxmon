# Table: users
* **Description:** 사용자 정보, 성인 인증 상태 및 SNS 프로필 저장 테이블
* **Version:** v1.5
* **Last Updated:** 2026-03-31 (SNS 및 프로필 사진 필드 추가)

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 사용자 고유 식별자 |
| `login_id` | String | Unique, Not Null | 로그인용 아이디 (4-15자) |
| `password` | String | Not Null | 암호화된 비밀번호 |
| `email` | String | Nullable | 정보 수신용 이메일 |
| `name` | String | Not Null | 사용자 성명 (본인인증 기반) |
| `nickname` | String | Unique, Not Null | 활동 닉네임 |
| `role` | String | Not Null, Default 'GENERAL' | 사용자 역할 (`GENERAL`, `EMPLOYER`, `ADMIN`, `SUPER_ADMIN`) |
| `birth_date` | String | Not Null | 생년월일 (YYYYMMDD, 본인인증 기반) |
| `age` | Integer | Not Null | 현재 나이 (가입 시점 계산 저장, 검색용) |
| `gender` | String | Not Null | 성별 (MALE, FEMALE, 본인인증 기반) |
| `phone_number` | String | Not Null | 휴대폰 번호 (본인인증 기반, 외국인은 이메일/해외번호) |
| `nationality` | String | Not Null, Default 'KOREAN' | 국적 (KOREAN, FOREIGNER) |
| `is_age_verified` | Boolean | Not Null, Default false | 성인 인증 완료 여부 |
| `business_name` | String | Nullable | 업체 상호명 (사장님 전용) |
| `representative_name` | String | Nullable | 대표자 성명 (사장님 전용) |
| `business_number` | String | Nullable | 사업자 번호 (사장님 전용, 10자리) |
| `business_category` | String | Nullable | 업종 유형 (사장님 전용) |
| `opening_date` | String | Nullable | 개업 일자 (YYYYMMDD, 사장님 전용) |
| `profile_image_url` | String | Nullable | 프로필 사진 URL |
| `sns_kakao` | String | Nullable | 카카오톡 아이디 또는 링크 |
| `sns_instagram` | String | Nullable | 인스타그램 아이디 또는 링크 |
| `sns_telegram` | String | Nullable | 텔레그램 아이디 또는 링크 |
| `sns_x` | String | Nullable | X (구 트위터) 아이디 또는 링크 |
| `paid_points` | BigInt | Not Null, Default 0 | 유료 포인트 잔액 (환불 가능) |
| `bonus_points` | BigInt | Not Null, Default 0 | 보너스 포인트 잔액 (환불 불가) |
| `merchant_tier` | String | Not Null, Default 'NORMAL' | 업체 등급 (NORMAL, VIP, VVIP, VVVIP) |
| `total_cash_spent` | BigInt | Not Null, Default 0 | 누적 현금 결제액 (등급 산정용) |
| `continuous_months` | Integer | Not Null, Default 0 | 연속 광고 유지 개월 수 (등급 산정용) |
| `has_first_charged` | Boolean | Not Null, Default false | 첫 충전 혜택 수혜 여부 |
### Role Definitions
*   **`GENERAL`**: 일반 사용자 (구직자). 이력서 작성 및 공고 지원 가능.
*   **`EMPLOYER`**: 업체 사용자 (사장님). 채용 공고(Jobs) 등록 및 관리 가능.
*   **`ADMIN`**: 일반 관리자. 채용 공고 승인, 회원 상태 모니터링 등 일일 운영 담당.
*   **`SUPER_ADMIN`**: 최고 관리자. 서비스 전체 제어, 관리자 계정 생성/삭제, 시스템 설정 관리.

> [!NOTE]
> 주민등록번호는 개인정보보호법에 따라 직접 수집하지 않으며, '본인인증(휴대폰/PASS)'을 통해 대체합니다.
> 현재 모든 관리자 계정(`ADMIN`, `SUPER_ADMIN`)은 보안상 DB에서 직접 관리자가 역할을 부여합니다.

| `verified_at` | Timestamp | Nullable | 성인 인증 완료 일시 |
| `created_at` | Timestamp | Not Null, Default now() | 가입 일시 |
