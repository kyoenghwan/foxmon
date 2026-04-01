# Table: jobs
* **Description:** 사업자가 등록하는 구인 공고(광고) 테이블 — 배너 정보 + 상세 내용 통합
* **Version:** v2.0
* **Last Updated:** 2026-03-31 (사업자 관리 시스템 연동을 위한 필드 대거 추가)

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 공고 고유 식별자 |
| `user_id` | UUID | FK (users.id), Nullable | 공고 소유 업체 (사업자 연결) |
| `company` | String | Not Null | 업체명 |
| `title` | String | Not Null | 공고 제목 (캐치프레이즈) |
| `location` | String | Not Null | 근무 지역 |
| `pay` | String | Not Null | 급여 정보 |
| `image` | String | Nullable | 배너 이미지 URL |
| `color` | String | Nullable | 테마 색상 (UI용) |
| `tier` | String | Not Null, Default 'GENERAL' | 광고 등급 (PREMIUM, SPECIAL, GENERAL) |
| `is_big` | Boolean | Not Null, Default false | 대형 카드 노출 여부 |
| `weight` | Integer | Not Null, Default 1 | 노출 가중치 |
| `exposure_count` | Integer | Not Null, Default 0 | 총 노출 횟수 |
| `last_exposed_at` | Timestamp | Default now() | 마지막 노출 일시 |
| `status` | String | Not Null, Default 'ACTIVE' | 공고 상태 (ACTIVE, PAUSED, EXPIRED) |
| `expires_at` | Timestamp | Nullable | 공고 만료 일시 |
| `view_count` | BigInt | Not Null, Default 0 | 구직자 열람 횟수 (팝업 오픈 기준) |
| `detail_content` | Text | Nullable | 상세 공고 내용 본문 |
| `detail_images` | Text[] | Nullable | 상세 이미지 URL 배열 |
| `work_type` | String | Nullable | 근무 형태 (예: 상주, 출퇴근) |
| `work_hours` | String | Nullable | 근무 시간 (예: 오전 10시~오후 6시) |
| `benefits` | String | Nullable | 복리후생 및 혜택 |
| `contact_info` | String | Nullable | 문의 연락처 |
| `address` | String | Nullable | 실제 업체 주소 |
| `created_at` | Timestamp | Not Null, Default now() | 생성 일시 |
| `updated_at` | Timestamp | Default now() | 최종 수정 일시 |
