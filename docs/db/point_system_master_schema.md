# Table: point_policies (포인트 정책 마스터)
* **Description:** 첫 충전 보너스, 최대 한도, 환불 수수료 등 전역 포인트 정책 관리 (스케줄링 지원)
* **Version:** v1.0
* **Last Updated:** 2026-03-31

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK | 정책 고유 식별자 |
| `config_key` | String | Not Null | 설정 키 (예: FIRST_CHARGE_BONUS) |
| `config_value` | Decimal | Not Null | 설정 값 |
| `start_at` | Timestamp | Not Null | 정책 시작 일시 (From) |
| `end_at` | Timestamp | Not Null, Default '9999-12-31' | 정책 종료 일시 (To) |
| `is_override` | Boolean | Default false | 긴급 즉시 적용 여부 |
| `created_by` | UUID | FK (users.id) | 등록 관리자 |
| `created_at` | Timestamp | Default now() | 등록 일품 |

---

# Table: tier_configs (등급별 조건 및 혜택)
* **Description:** VIP, VVIP 등 등급별 승급 조건 및 보너스 적립율 관리
* **Version:** v1.0

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `tier_name` | String | PK | 등급명 (NORMAL, VIP, VVIP, VVVIP) |
| `min_months` | Integer | Not Null | 최소 연속 유지 개월 수 |
| `min_spend` | BigInt | Not Null | 최소 누적 실결제 금액 (원) |
| `bonus_ratio` | Decimal | Not Null | 보너스 적립 비율 (0.1 ~ 0.3) |
| `updated_at` | Timestamp | Default now() | 최종 수정 일시 |

---

# Table: point_recharge_history (충전 이력 및 가치 기록)
* **Description:** 충전 시점의 원금과 포인트 가치를 기록하여 FIFO 정산 및 환불 근거 제공
* **Version:** v1.0

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK | 충전 고유 ID |
| `user_id` | UUID | FK (users.id) | 충전 사용자 |
| `cash_amount` | BigInt | Not Null | 실제 입금 현금액 (원) |
| `point_amount` | BigInt | Not Null | 지급된 총 포인트 (원금 + 보너스) |
| `bonus_ratio` | Decimal | Not Null | 적용된 보너스율 |
| `remained_point` | BigInt | Not Null | 해당 충전 건에서 아직 사용되지 않은 잔여 포인트 (FIFO용) |
| `is_first_charge` | Boolean | Default false | 첫 충전 혜택 적용 여부 |
| `created_at` | Timestamp | Default now() | 충전 일시 |

---

# Table: point_transactions (포인트 거래 로그)
* **Description:** 포인트의 모든 증감(충전, 사용, 차감, 환불) 이력 기록
* **Version:** v1.0

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK | 거래 고유 ID |
| `user_id` | UUID | FK (users.id) | 대상 사용자 |
| `type` | String | Not Null | 거래 유형 (CHARGE, SPEND, REFUND, EXPIRE) |
| `source_recharge_id` | UUID | Nullable, FK | (사용 시) 어떤 충전 건에서 차감되었는지 기록 (FIFO 연결) |
| `amount` | BigInt | Not Null | 변동 금액 (+/-) |
| `balance_after` | BigInt | Not Null | 거래 후 최종 잔액 |
| `description` | String | Nullable | 상세 사유 (예: '프리미엄 광고 등록 차감') |
| `created_at` | Timestamp | Default now() | 거래 일시 |

---

# Table: refund_requests (환불 신청 관리)
* **Description:** 사업자 환불 신청 및 처리 상태 관리 (보안을 위해 계좌 정보는 신청 시점에만 수집)
* **Version:** v1.0

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK | 신청 고유 ID |
| `user_id` | UUID | FK (users.id) | 신청자 |
| `cash_amount` | BigInt | Not Null | 산출된 환불 예정 현금액 |
| `bank_name` | String | Not Null | 환불 은행명 |
| `account_number` | String | Not Null | 환불 계좌번호 |
| `account_holder` | String | Not Null | 예금주 |
| `status` | String | Default 'PENDING' | 상태 (PENDING, COMPLETED, REJECTED) |
| `processed_at` | Timestamp | Nullable | 처리 완료 일시 (3일 내 입금 안내용) |
| `created_at` | Timestamp | Default now() | 신청 일시 |
