# 고객센터 DB 스키마

---

# Table: notices (공지사항)
* **Description:** 관리자가 등록하는 공지사항 게시판
* **Version:** v1.0
* **Last Updated:** 2026-04-01

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 공지 고유 ID |
| `category` | String | Not Null, Default '공지' | 카테고리 (공지, 기타) |
| `title` | String | Not Null | 제목 |
| `content` | Text | Not Null | 내용 |
| `is_pinned` | Boolean | Default false | 상단 고정(알림) 여부 |
| `author_id` | UUID | FK (users.id) | 작성자 (관리자) |
| `author_name` | String | Not Null, Default '영자' | 표시할 작성자명 |
| `view_count` | Integer | Default 0 | 조회수 |
| `created_at` | Timestamp | Default now() | 작성일 |
| `updated_at` | Timestamp | Default now() | 수정일 |

---

# Table: faqs (자주 묻는 질문)
* **Description:** 카테고리별 FAQ 아코디언
* **Version:** v1.0
* **Last Updated:** 2026-04-01

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | FAQ 고유 ID |
| `category` | String | Not Null | 카테고리 (이용안내, 포인트·결제, 광고문의, 이력서·지원, 기타) |
| `question` | String | Not Null | 질문 |
| `answer` | Text | Not Null | 답변 |
| `sort_order` | Integer | Default 0 | 정렬 순서 |
| `is_active` | Boolean | Default true | 표시 여부 |
| `created_at` | Timestamp | Default now() | 작성일 |

---

# Table: inquiries (1:1 문의)
* **Description:** 사용자 1:1 문의 접수 및 답변 관리
* **Version:** v1.0
* **Last Updated:** 2026-04-01

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 문의 고유 ID |
| `user_id` | UUID | FK (users.id), Not Null | 문의자 |
| `category` | String | Not Null | 유형 (계정문의, 포인트·환불, 광고문의, 신고·제재, 건의사항, 기타) |
| `title` | String | Not Null | 제목 |
| `content` | Text | Not Null | 내용 |
| `status` | String | Default 'PENDING' | 상태 (PENDING, ANSWERED, CLOSED) |
| `reply` | Text | Nullable | 관리자 답변 |
| `replied_by` | UUID | FK (users.id), Nullable | 답변 관리자 |
| `replied_at` | Timestamp | Nullable | 답변 일시 |
| `created_at` | Timestamp | Default now() | 접수 일시 |

## Status Definitions
- **`PENDING`**: 접수됨, 답변 대기 중
- **`ANSWERED`**: 관리자가 답변 완료
- **`CLOSED`**: 처리 완료 (사용자가 확인)
