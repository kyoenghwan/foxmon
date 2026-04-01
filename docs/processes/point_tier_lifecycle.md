# Process: Point & Tier Lifecycle (포인트 및 등급 생명주기)
* **Description:** 충전부터 광고 집행, 등급 승격 및 환불까지의 전 과정 프로세스 정의
* **Version:** v1.0
* **Last Updated:** 2026-03-31

---

### 1. 포인트 충전 프로세스 (Recharge)
1. **입력:** 충전 금액(Cash) 전달.
2. **정책 조회:** `QA_GET_ACTIVE_POLICY` 호출하여 현재 활성 정책(보너스 비율, 한도 등) 조회.
3. **보너스 계산:** 
    - `has_first_charged`가 `false`면 **50%** 적용. (단, `MAX_FIRST_BONUS` 상한 적용)
    - `true`면 현재 등급(`current_tier`)에 따른 보너스(10~30%) 적용.
4. **저장:** `point_recharge_history`에 원금/지급포인트 기록 및 `users.paid_points`, `users.bonus_points` 업데이트.

### 2. 광고 등록 및 포인트 차감 (Spend - FIFO)
1. **금액 확인:** 등록하려는 광고의 단가(Points) 확인.
2. **잔액 검증:** `bonus_points + paid_points >= required_points` 여부 확인.
3. **차감 시나리오:**
    - **Step 1:** `bonus_points`에서 우선 차감.
    - **Step 2:** 부족분 발생 시 `paid_points`에서 차감.
    - **Step 3 (Audit/FIFO):** `point_recharge_history`에서 가장 오래된(ASC) 충전 건의 `remained_point`를 먼저 소진.
4. **기록:** `point_transactions`에 차감 내역 및 소스 충전 ID 매핑 저장.

### 3. 실시간 환불 시뮬레이션 및 신청 (Refund)
1. **시율레이션:** 사용자가 '환불하기' 클릭 시 `QA_GET_REFUND_INFO` 호출.
2. **계산 공식:** 
    - 각 충전 건별: `(남은 유료 포인트) / (지급 총 포인트 / 충전 원금)`
    - 전체 합산 후 **10% 수수료 차감**.
3. **신청:** 사용자로부터 **은행명, 계좌번호, 예금주**를 새로 입력받아 `refund_requests`에 `PENDING` 상태로 저장.
4. **처리:** 관리자 승인 후 3영업일 이내 입금 완료(`COMPLETED`) 처리.

### 4. 정책 스케줄링 및 즉시 교체 (Policy Scheduling)
1. **정책 예약:** 관리자가 `start_at`을 미래 시점으로 설정하여 신규 정책 등록.
2. **즉시 교체 (Override):**
    - '즉시 적용' 체크 시, 현재 진행 중인 정책의 `end_at`을 `NOW()`로 강제 단축.
    - 새 정책의 `start_at`을 `NOW()`로 설정하여 즉시 활성화.
3. **조회:** 시스템은 항상 `WHERE start_at <= NOW() AND end_at > NOW()`인 정책을 SSOT로 사용.

---

### 5. 연관 데이터베이스 (Touched DB Schema)
* `users` 테이블 (포인트 잔액, 등급 상태)
* `point_policies` (정책 타임라인)
* `point_recharge_history` (가치 기록 및 FIFO)
* `refund_requests` (환불 진행 상태)
