---
name: foxmon-project-index
description: 폭스몬의 페이지·Atom 경로와 DB 문서를 조회하거나 변경할 때 색인과 실제 구현의 일치를 확인한다.
---

# 폭스몬 색인과 데이터 문서

루트 AGENTS.md를 따른다. 경로는 폭스몬 루트 기준이다.

- 위치 색인: docs/project_map.yaml. 흐름: docs/processes. 테이블 설명: docs/db/*_schema.md.
- migration 후보: supabase/migrations 및 루트 SQL. docs/db/schema.sql은 없으므로 존재하는 통합 스키마로 안내하지 않는다.
- 새 페이지·주요 컴포넌트·Atom 또는 경로 변경은 실제 import와 색인을 함께 갱신한다. 작은 내부 변수 변경에 색인 확장을 강제하지 않는다.
- 색인 경로가 없으면 rg로 실제 파일을 찾고 불일치를 기록한다. 없는 경로를 기준으로 대체 컴포넌트를 만들지 않는다.
- DB 필드·제약은 문서와 실제 코드·승인된 DB 메타데이터를 비교한다. 문서 불일치를 근거로 운영 DB를 임의 수정하지 않는다.
- 승인된 schema 변경은 migration·테이블 문서·타입·영향받는 원자와 색인에 반영한다. 사용자 요청 밖에서 통합 스키마를 새로 합성하지 않는다.
- docs/templates/project_yaml_templates.md는 기존 양식을 확인할 때만 읽는다. 양식의 승인 대기 절차보다 AGENTS.md를 우선한다.
