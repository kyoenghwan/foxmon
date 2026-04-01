# Table: foxtalk_rooms
* **Description:** 여우토크(오픈채팅/비밀채팅) 방 메타데이터 저장 테이블
* **Version:** v1.0
* **Last Updated:** 2026-03-27

| 필드명 | 타입 | 제약조건 (PK, FK, Nullable 등) | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 채팅방 고유 식별자 |
| `type` | String | Not Null (OPEN, SECRET) | 방 타입 (오픈방, 비밀방) |
| `title` | String | Not Null | 채팅방 제목 |
| `room_code` | String | Unique, Nullable | 비밀방 접속을 위한 랜덤 코드 (OPEN방은 Null) |
| `password_hash` | String | Nullable | 비밀방 접속을 위한 비밀번호 해시값 |
| `max_participants` | Integer | Not Null, Default 100 | 최대 참여 가능 인원 |
| `created_by` | String | Not Null | 방장 식별자 (임시 세션 ID 또는 유저 ID) |
| `created_at` | Timestamp | Not Null | 방 생성 일시 |
| `last_message_at` | Timestamp | Nullable | 마지막 메시지 전송 일시 (정렬용) |
| `is_active` | Boolean | Not Null, Default true | 방 활성화 여부 |

---

# Table: foxtalk_participants
* **Description:** 여우토크 방 참여자 목록 및 프로필 정보
* **Version:** v1.0
* **Last Updated:** 2026-03-27

| 필드명 | 타입 | 제약조건 (PK, FK, Nullable 등) | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 참여 이력 고유 식별자 |
| `room_id` | UUID | FK(foxtalk_rooms.id), Not Null | 참여중인 채팅방 ID |
| `session_id` | String | Not Null | 유저 개인 브라우저 세션 ID (익명 보장용 고유값) |
| `nickname` | String | Not Null | 방에서 사용할 임시 닉네임 |
| `avatar_type` | String | Not Null | 선택한 여우 캐릭터 타입 (fox1, fox2 등) |
| `joined_at` | Timestamp | Not Null | 최초 참여 일시 |
| `last_read_at` | Timestamp | Nullable | 마지막으로 메시지를 읽은 시간 (안읽음 카운트용) |

* **Index:** `room_id` 와 `session_id` 로 복합 유니크 제약조건 (같은 방 중복 입장 방지)

---

# Table: foxtalk_messages
* **Description:** 여우토크 방 내 실제 오고가는 메시지 스토어 (Supabase Realtime 기반)
* **Version:** v1.0
* **Last Updated:** 2026-03-27

| 필드명 | 타입 | 제약조건 (PK, FK, Nullable 등) | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 메시지 고유 식별자 |
| `room_id` | UUID | FK(foxtalk_rooms.id), Not Null | 메시지가 속한 방 ID |
| `participant_id` | UUID | FK(foxtalk_participants.id), Nullable | 메시지를 보낸 참여자 ID (시스템 메시지일 경우 Null) |
| `content` | Text | Not Null | 메시지 내용 |
| `message_type` | String | Not Null, Default 'TEXT' | 메시지 종류 (TEXT, SYSTEM_JOIN, SYSTEM_LEAVE) |
| `created_at` | Timestamp | Not Null | 메시지 전송 일시 |

* **Note:** 이 테이블은 반드시 Supabase Dashboard의 `Replication(Realtime)` 설정에서 활성화되어야 채팅이 작동합니다.
* **Cron Job:** `created_at` 기준 1일(24시간)이 지난 데이터는 `pg_cron` 등을 통해 스케줄링 삭제하거나 RLS 뷰를 통해 숨김 처리.
