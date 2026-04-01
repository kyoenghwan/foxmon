# Table: resumes

* **Description:** 사용자(구직자) 상세 이력서 저장 테이블
* **Version:** v1.0
* **Last Updated:** 2026-03-31

| 필드명 | 타입 | 제약조건 (PK, FK, Nullable 등) | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 이력서 고유 식별자 |
| `user_id` | UUID | FK(users.id), Not Null | 이력서 작성 회원 ID |
| `title` | String | Not Null | 이력서 제목 |
| `nickname` | String | Nullable | 닉네임 (별명) |
| `gender` | Enum | 'M' \| 'F', Nullable | 성별 |
| `contact_number` | String | Nullable | 연락처 |
| `is_contact_public` | Boolean | Default false | 연락처 공개 여부 |
| `sns_type` | String | Nullable | 주요 이용 SNS(카톡/인스타 등) |
| `sns_id` | String | Nullable | SNS 아이디/주소 |
| `desired_location` | String | Nullable | 희망 근무지역 |
| `desired_industry` | String | Nullable | 희망 업종 |
| `desired_pay_type` | String | Nullable | 시급 / 일급 / 월급 |
| `desired_pay_amount` | Number | Nullable | 희망 페이 액수 |
| `contact_time` | String | Nullable | 연락 가능 시간 |
| `is_anytime_contact` | Boolean | Default false | 연락시간 상관없음 여부 |
| `photo_url` | String | Nullable | 증명사진/프로필 사진 경로 |
| `self_introduction` | Text | Nullable | 상세 자기소개 및 경력사항 |
| `is_active` | Boolean | Default true | 열람 제한/비공개 처리 여부 |
| `created_at` | Timestamp | Not Null | 등록 일시 |
| `updated_at` | Timestamp | Not Null | 최근 수정 일시 |
