# Table: point_charge_requests
* **Description:** 업체(EMPLOYER)의 포인트 충전 신청 및 관리자 승인 처리 이력
* **Version:** v1.0
* **Last Updated:** 2026-03-31

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Default gen_random_uuid() | 신청 고유 식별자 |
| `user_id` | UUID | FK (users.id), Not Null | 신청 업체 |
| `requested_amount` | BigInt | Not Null | 신청 충전 금액 (원) |
| `deposit_name` | String | Not Null | 입금자명 |
| `status` | String | Not Null, Default 'PENDING' | 처리 상태 (PENDING, APPROVED, REJECTED) |
| `admin_note` | String | Nullable | 관리자 처리 메모 |
| `processed_by` | UUID | FK (users.id), Nullable | 처리한 관리자 |
| `created_at` | Timestamp | Not Null, Default now() | 신청 일시 |
| `processed_at` | Timestamp | Nullable | 처리 완료 일시 |

## Status Definitions
- **`PENDING`**: 입금 대기 중 (관리자 확인 전)
- **`APPROVED`**: 입금 확인 완료 → 포인트 자동 지급됨
- **`REJECTED`**: 입금 미확인 또는 오류로 반려
