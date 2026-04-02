# Process: FoxTalk
* **Description:** 사용자간 실시간 채팅 (오픈채팅/비밀방) 기능
* **Version:** 1.0
* **Last Updated:** 2026-04-02

### 1. 프로세스 시퀀스 (FA_MANAGE_FOXTALK_FLOW)
   - **GET_ROOMS**: `QA_GET_CHAT_ROOMS` 호출, 현재 활성화된 채팅방 리스트 반환
   - **GET_MESSAGES**: `QA_GET_CHAT_MESSAGES` 호출, 특정 채팅방의 메시지 이력 조회
   - **CREATE_ROOM**: `OA_INSERT_CHAT_ROOM` 호출, 신규 채팅방 개설
   - **SEND_MESSAGE**: `OA_INSERT_CHAT_MESSAGE` 호출, 메시지 기록 및 룸 갱신
