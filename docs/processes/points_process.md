# Process: Points
* **Description:** 사용자 포인트 충전, 차감(결제), 환불 요청 및 정산 기능의 전체 흐름
* **Version:** v1.0
* **Last Updated:** 2026-04-02

### 1. UI/UX 화면 흐름 (Screen Flow)
* **결제(Recharge):** `[포인트 충전 모달]` -> `[결제수단 선택 및 PG사 모듈]` -> `[완료 화면 및 잔액 갱신]`
* **차감(Deduct):** `[서비스 구매 버튼(이력서/광고)]` -> `[포인트 차감 컨펌 창]` -> `[구매 완료 및 서비스 활성화]`
* **환불(Refund):** `[마이페이지 환불관리]` -> `[환불 시뮬레이터 구동]` -> `[환불 신청 접수]` -> `[어드민 환불 승인 대기]`

### 2. 프로세스 시퀀스 및 연결된 FA (Flow Atoms)
1. **포인트 충전 (FA_RECHARGE_POINT_FLOW):**
   - 선행 (QA): 사용자의 첫 충전 여부 및 현재 등급(`QA_GET_USER_RECHARGE_CONTEXT`) 조회
   - 검증 (RA): 등급 및 정책을 바탕으로 최종 보너스율 계산 (`RA_CALC_RECHARGE_BONUS`)
   - 실행 (OA): 결제 내역 저장, 포인트 증액, 거래 로그 기록 (`OA_EXECUTE_POINT_RECHARGE`)
   
2. **서비스 구매 차감 (FA_DEDUCT_POINT_FOR_AD):**
   - 선행 (QA): 현재 사용자 보유 잔액 및 잔여 충전 이력(FIFO용) 리스트업 (`QA_GET_DEDUCTION_CONTEXT`)
   - 검증 (RA): 차감 순서(보너스 선 차감 -> 잔여 유료 FIFO 차감) 수립 및 잔액 검증 (`RA_CALC_DEDUCTION_FIFO`)
   - 실행 (OA): 사용자 잔액 차감, 충전 이력 차감, 거래 로그 기록의 트랜잭션 수행 (`OA_EXECUTE_BATCH_DEDUCTION`)
   
3. **환불 신청 (FA_REQUEST_REFUND_FLOW):**
   - 선행 (QA): 유효 환불 대상 충전 이력 및 현재 수수료 정책 조회 (`QA_GET_REFUND_CONTEXT`)
   - 검증 (RA): 현금 가치 배수(Pro-Rata) 정밀 정산 및 수수료 계산 (`RA_CALC_REFUND_PRO_RATA`)
   - 조립 (FA_GET_REFUND_SIMULATION): 위 로직까지만 수행하여 UI 화면에 예상 결과 모의 반환
   - 실행 (OA): 환불 대기 큐 등록 및 즉각적인 (보너스 포함) 전체 잔액 소멸 (`OA_SUBMIT_REFUND_REQUEST`)

### 3. 연관 데이터베이스 (Touched DB Schema)
* `users` 테이블 (참조: `docs/db/users_schema.md`)
* `point_policies`, `tier_configs` 테이블 (참조: `docs/db/point_system_master_schema.md`)
* `point_recharge_history`, `point_transactions` 테이블 (참조: `docs/db/point_system_master_schema.md`)
* `refund_requests` 테이블 (참조: `docs/db/point_charge_requests_schema.md`)
