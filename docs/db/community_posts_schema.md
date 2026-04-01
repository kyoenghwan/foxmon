# Table: community_posts
* **Description:** 커뮤니티 게시판 게시글 통합 테이블 (7개 게시판 공유)
* **Version:** v1.0
* **Last Updated:** 2026-04-01

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 게시글 고유 ID |
| `board_id` | String | Not Null | 게시판 ID (free, foxtalk, foxmarket, reviews, tips, report, business) |
| `user_id` | UUID | FK (users.id), Not Null | 작성자 |
| `author_name` | String | Not Null | 표시할 작성자명 (닉네임 or '익명') |
| `is_anonymous` | Boolean | Default false | 익명 여부 (report 게시판은 강제 true) |
| `title` | String | Not Null | 제목 |
| `content` | Text | Not Null | 내용 |
| `thumbnail` | String | Nullable | 대표 이미지 URL (foxmarket용) |
| `price` | String | Nullable | 가격 정보 (foxmarket용) |
| `view_count` | Integer | Default 0 | 조회수 |
| `comment_count` | Integer | Default 0 | 댓글 수 |
| `is_hot` | Boolean | Default false | HOT 게시글 여부 |
| `created_at` | Timestamp | Default now() | 작성일 |
| `updated_at` | Timestamp | Default now() | 수정일 |

## Board ID Definitions
| board_id | 게시판명 | 접근 권한 |
|---|---|---|
| `free` | 자유게시판 | 전체 (USER, EMPLOYER, ADMIN, SUPER_ADMIN) |
| `foxtalk` | 폭스수다 | USER 전용 (여성 회원) |
| `foxmarket` | 폭스중고 | USER 전용 (여성 회원) |
| `reviews` | 업소후기 | USER 전용 (여성 회원) |
| `tips` | 꿀팁·노하우 | USER 전용 (여성 회원) |
| `report` | 업소제보 | USER 전용 (여성 회원, 강제 익명) |
| `business` | 업소장터 | EMPLOYER 전용 (사업자) |
