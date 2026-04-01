# Process: Job Rotation and Exposure (구인 광고 로테이션 및 노출 프로세스)
* **Description:** 광고 등급별 공정한 로테이션 알고리즘 및 노출 횟수 갱신 프로세스
* **Version:** v1.0
* **Last Updated:** 2026-03-26

### 1. UI/UX 화면 흐름 (Screen Flow)
* `[홈 화면]` -> `[광고 섹션 (Premium/Special/General)]` -> `[공고 상세 (외부 링크/상세페이지)]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **광고 데이터 조회:** 홈 화면 진입 시 `FA_GET_ROTATED_ADS` 호출
   - 등급(Tier)별로 데이터를 필터링하여 가져옴.
   - 최근 1시간 내 노출되지 않았거나, 노출 횟수가 적은 항목 우선순위 정렬.
   - 랜덤성을 가미하여 상위 항목 중 일부 추출.
2. **광고 렌더링:** `FW_JOB_CARD` 컴포넌트에서 데이터 출력
3. **노출 기록:** 화면에 광고가 노출되거나 클릭될 때 `FA_RECORD_EXPOSURE` 호출
   - `jobs` 테이블의 `exposure_count` 증가 및 `last_exposed_at` 갱신.

### 3. 연관 데이터베이스 (Touched DB Schema)
* `jobs` 테이블 (조회 및 수정)
