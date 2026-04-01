# Process: FoxTalk (여우토크) 실시간 플로팅 오픈채팅 프로세스
* **Description:** 웹사이트를 탐색하면서 화면 우측 하단의 플로팅 위젯을 통해 익명으로 실시간 채팅에 참여하거나 비밀 채팅방을 개설/참여하는 전체 흐름
* **Version:** v1.0
* **Last Updated:** 2026-03-27

### 1. UI/UX 화면 흐름 (Screen Flow)
* `[모든 메인/서브 페이지 우측 하단 여우 아이콘]` -> `(클릭)` -> `[위젯 오픈: 초기 프로필 설정 창]` -> `(설정 완료)` -> `[위젯 내 대화방 목록 (로비)]` -> `(방 개설 or 방 클릭)` -> `[실시간 채팅방 UI]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **위젯 활성화 및 인증 체크:** 유저가 여우 아이콘 클릭 시 위젯 오픈. 내부 로컬 스토리지에 임시 세션 ID와 프로필 정보가 있는지 확인.
2. **프로필 설정:** 정보가 없으면 아바타와 닉네임을 설정. 완료 시 로컬 스토리지(또는 쿠키)에 저장. (이 과정은 앱 로그인이 아닌 FoxTalk 익명 채팅 전용).
3. **로비 진입 및 방 목록 조회:** `FA_LOAD_CHAT_ROOMS` 호출. 
    * `OPEN` 타입의 방 리스트 반환
    * 현재 접속자수(`participants` 카운트) 기반 인기순 정렬
4. **방 생성 (OPEN/SECRET):** 
    * 유저가 방 만들기 버튼 클릭 -> 정보 입력 -> `FA_CREATE_CHAT_ROOM` 호출
    * `SECRET` 인 경우 랜덤 `room_code` 발급 및 비밀번호 해싱 저장.
5. **방 진입 (Join):**
    * 기존 방 클릭 시 `FA_JOIN_CHAT_ROOM` 호출.
    * `SECRET` 방일 경우 사용자에게 비밀번호 입력 프롬프트 띄움. 맞으면 진입.
    * 입장 성공 시 `foxtalk_participants` 에 레코드 추가 & 시스템 메시지("OOO 님이 입장했습니다.") 발송.
6. **실시간 채팅 (Supabase Realtime):**
    * 채팅방 렌더링 시 Supabase `channel('room_id').on('postgres_changes', ...)` 로 웹소켓 구독 시작.
    * 사용자가 메시지 입력 후 전송 -> `FA_SEND_CHAT_MESSAGE` (단순히 DB에 INSERT).
    * DB에 들어간 메시지가 Realtime을 통해 모든 접속자에게 브로드캐스팅되어 화면에 표시.

### 3. 채팅 메시지 자동 휘발(폭파) 정책 (TTL)
* 채팅방 대화가 시간 경과 후 사라지게 만들기 위해 다음과 같은 조치를 취함:
    * **정책 1:** 생성 후 24시간이 지난 구형 방/메시지 데이터는 Supabase `pg_cron` 익스텐션을 사용하여 매일 자정 자동 DELETE 실행.
    * **정책 2 (대안):** RLS 설정 또는 프론트엔드 조회 시 `WHERE created_at > NOW() - INTERVAL '1 day'` 강제.

### 4. 연관 데이터베이스 (Touched DB Schema)
* `foxtalk_rooms`: 방 생성, 조회, 상태 관리
* `foxtalk_participants`: 활성 접속자 세션 관리 및 프로필 매핑
* `foxtalk_messages`: 핵심 실시간 데이터 스트리밍 타겟 테이블
