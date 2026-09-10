# 폭스몬 기술 안내

공통 작업·검증 규칙은 AGENTS.md가 원본이다. 이 문서는 구조를 안내하며 현재 배포나 DB 정상 상태를 보증하지 않는다.

## 구조와 진입점

- Next.js 16.1.6 App Router, React 19.2.3, TypeScript, Tailwind 3.4 계열. 실제 설치 버전은 lockfile과 node_modules로 확인한다.
- app: 페이지·레이아웃·API. app/(admin)/fox-office: 관리자. app/api: 공개 HTTP 경계.
- auth.ts·auth.config.ts·middleware.ts: NextAuth 인증과 페이지 접근 제어. API와 Server Action은 자체 인증·인가 경계를 확인한다.
- src/atoms: 역할별 FA·QA·OA·RA 등. 기존 atoms, lib, actions에도 로직이 있으므로 한쪽만 검색하지 않는다.
- components와 src/components: 두 UI 경로 모두 사용된다. lib/logger.ts와 src/lib/logger.ts도 호출자가 다르므로 합치거나 바꾸기 전에 import를 추적한다.
- lib/supabase.ts·utils/supabase/server.ts: DB 접근. NextAuth 세션이 Supabase 사용자 JWT와 같다고 가정하지 않는다. 관리자 키 대체 동작·RLS·RPC 실행 권한은 별도 확인한다.
- docs/project_map.yaml: UI/Atom 위치 색인. docs/processes: 도메인 흐름. docs/db: 테이블 설명. supabase/migrations 및 루트 SQL: 변경 이력 후보.
- docs/db/schema.sql은 현재 없다. LIFORY의 통합 스키마 경로를 가정하지 않는다. SQL 파일 존재는 운영 반영 증거가 아니다.

## 유지할 기술 제약

- DA 타입, CA 설정, TA 진입점 정의, EA 이벤트, RA 순수 검증/계산, QA 읽기, OA 쓰기, FA 흐름 조립의 책임을 유지한다.
- RA에서 DB·네트워크·브라우저 상태에 접근하지 않고, QA에서 숨은 보정 데이터를 쓰지 않는다. FA는 결과를 반환하고 UI가 화면 상태를 변경한다.
- 여러 DB 변경이 하나의 결과면 원자적 트랜잭션을 우선 검토한다. 외부 부수효과는 실제 복구·중복 방지·부분 성공을 설계한다. 반환값 이름만으로 원자성을 주장하지 않는다.
- 인증·성인 여부·소유권·관리자 권한은 서버에서 검증한다. 쿠키 존재나 UI 숨김만으로 보장하지 않는다.
- 로그는 작업명·단계·오류 코드·소요 시간 중심으로 남긴다. 입력 객체·채팅 본문·CI·비밀번호를 통째로 기록하지 않는다. 기존 로거에 자동 마스킹 기능이 있다고 가정하지 않는다.
- 배너 역수 비율과 모바일 CSS zoom, 명시적 "닫기" 텍스트, 이미지 WebP 변환은 관련 docs/project_rules 지침을 따른다.

## 현재 명령과 주의점

| 목적 | 명령 |
|---|---|
| 개발 | npm run dev |
| 타입검사 | node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false |
| 린트 | npm run lint |
| 프로덕션 빌드 | npm run build |
| 빌드 실행 | npm start |

현재 package.json에 test 스크립트가 없다. 루트와 scratch의 test 스크립트를 안전한 자동 테스트로 간주하지 않는다. 현재 next.config.ts는 타입 오류를 무시하므로 빌드 성공과 타입검사 통과는 별개다. 빌드는 PWA 산출물과 .next를 만들 수 있으므로 전후 변경을 확인한다.
