# Table: common_codes

- **Description:** 공지 타입, 공고 지역, 업종 등 시스템 전반에서 사용되는 마스터 데이터(공통 코드)를 EAV 패턴으로 단일 테이블에서 한 번에 관리합니다.
- **Version:** v1.0
- **Last Updated:** 2026-04-21

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 고유 식별자 (자동 생성을 위해 DB상에 `gen_random_uuid()` 적용) |
| `list_type` | VARCHAR | Not Null | 코드 분류 (예: 'NOTICE_TYPE', 'JOB_REGION', 'JOB_INDUSTRY', 'SALARY_TYPE', 'BENEFITS') |
| `code_value` | VARCHAR | Not Null | 시스템 내부 저장용 논리 값 (예: 'SEOUL', 'IT') |
| `code_name` | VARCHAR | Not Null | 사용자 노출용 출력 값 (예: '서울', 'IT/스타트업') |
| `sort_order` | INT | Default 0 | UI 출력 시 노출 순서 |
| `is_active` | BOOLEAN | Default true | 활성화 상태 (Soft Delete 용도) |
| `description` | TEXT | Nullable | 어드민 참고용 설명 (선택) |
| `created_at` | Timestamp | Not Null, Default now() | 생성 일자 |
| `updated_at` | Timestamp | Not Null, Default now() | 수정 일자 |

## 인덱스 정보
| 인덱스명 | 대상 필드 | 타입 | 설명 |
|---|---|---|---|
| `idx_common_codes_list_type` | `list_type` | BTREE | 리스트 타입 기반 빠른 조회 |
| `idx_common_codes_value` | `list_type`, `code_value` | BTREE | 중복방지 및 타입+값 결합 빠른 서치 |

## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-04-21 | 초기 작성 (마스터 데이터 단일 관리 체계 구축) |
