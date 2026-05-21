# Table: search_keywords

- **Description:** 검색창 실시간 인기 검색 키워드 및 누적 클릭 횟수 관리 테이블
- **Version:** v1.0
- **Last Updated:** 2026-05-21

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `keyword` | String | PK, Not Null | 검색 키워드 |
| `clicks_count` | BigInt | Not Null, Default 1 | 누적 검색/클릭 횟수 |
| `created_at` | Timestamp | Not Null, Default now() | 최초 검색 생성 일시 |
| `updated_at` | Timestamp | Not Null, Default now() | 최근 검색 업데이트 일시 |

## 인덱스 정보
| 인덱스명 | 대상 필드 | 타입 | 설명 |
|---|---|---|---|
| `idx_search_keywords_clicks` | `clicks_count DESC` | BTREE | 인기 키워드 순위 내림차순 정렬용 인덱스 |

## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-05-21 | 초기 스키마 설계 및 생성 |
