# 폭스몬 지침 이식 및 출시 전 결함 점검

검사일 2026-09-08. LEVEL 3. 지침·스킬·진단 문서만 change-authorized이며 앱 결함은 verification-only다. 앱 코드 수정, 운영 DB 변경, 커밋·push·배포는 수행하지 않았다.

## 적용 결과

LIFORY의 실제 로컬 프로젝트 C:/Antigravity_Google/diary에서 AGENTS.md, PROJECT_GUIDE.md, agent-kit 안내 및 스킬 네 개를 읽었다. 폭스몬에 AGENTS.md·PROJECT_GUIDE.md와 foxmon-atom-design, foxmon-design-system, foxmon-project-index, foxmon-work-continuity 스킬을 만들었다. 루트 지침의 명시적 파일 라우팅으로 사용하며 전역 설치·앱 자동 등록은 수행하지 않았다.

LIFORY의 LEVEL 생략 규칙 대신 이 대화의 LEVEL 1~3 지침을 유지했다. 폭스몬의 배너 역수 비율·425px CSS zoom·WebP·닫기 텍스트 제약을 보존했다. Vite·기억 데이터 모델·없는 통합 스키마 경로는 이식하지 않았다. .rules의 과거 승인 대기·전체 입력 로깅·형식적 롤백 강제는 루트 지침보다 우선하지 않도록 정리했다. Cursor 자동 push 규칙도 사용자 요청 기준으로 변경했다.

## 우선 조치가 필요한 결함

| ID | 우선도 | 확인된 코드와 영향 | 증거 위치 |
|---|---|---|---|
| C02 | 긴급 | 인증 없는 GET으로 광고 일괄 변경·DB schema/RPC 변경·자동 점프 실행을 시도한다. middleware는 API를 제외한다. 실제 성공 여부는 배포·DB 권한에 달려 있다. | app/api/fix-side-ads/route.ts:6, app/api/migrate-constraint/route.ts:6,114, app/api/cron/auto-jump/route.ts:6,42, middleware.ts:118 |
| C03 | 긴급 | 푸시 API가 인증과 대화방 참여자 필터 없이 구독자를 조회한다. 실제 채팅 호출자가 본문 앞 100자를 전달하므로 다른 방 구독자에게 내용이 전달될 위험이 있다. | app/api/push/send/route.ts:17,26, src/atoms/oa/foxtalk/OA_INSERT_CHAT_MESSAGE.ts:80 |
| C04 | 긴급 | 포인트 잔액·충전 이력·거래 로그를 서로 다른 요청으로 갱신한다. 중간 실패 시 이전 쓰기의 보상이 없고 동시 읽기/쓰기의 갱신 유실 가능성이 있다. | src/atoms/oa/points/OA_EXECUTE_BATCH_DEDUCTION.ts:38,50,68,79,103, src/atoms/fa/points/FA_DEDUCT_POINT_FOR_AD.ts:52,60 |
| C05 | 높음 | 조회 QA가 유료 잔액과 이력 차액을 충전 이력으로 INSERT한다. 생성 실패도 무시하고 성공 반환 가능. 동시 조회의 중복 보정 위험이 있다. | src/atoms/qa/points/QA_GET_DEDUCTION_CONTEXT.ts:51,58,72,98 |
| C06 | 긴급 | middleware는 게스트·성인 쿠키 값의 진위 대신 존재만 검사한다. 발급되는 게스트 값도 무서명 base64다. 해당 페이지 접근 제어 경계에서 인증 결과를 신뢰할 근거가 부족하다. | middleware.ts:16,18,87,94, src/atoms/oa/auth/OA_CREATE_GUEST_SESSION.ts:21 |
| C07 | 높음 | 뽑기 화면이 board가 없으면 반환한 뒤 useState를 호출한다. board 존재 여부 변경 시 Hook 순서가 달라진다. | src/components/game/RetroDrawGame.tsx:181,190, app/(dashboard)/job-seeker/play/PlayDashboardClient.tsx:182 |
| C08 | 높음 | 타입검사 20개 오류. 빌드에서 타입 오류를 무시하도록 설정돼 있다. 현재 로컬 빌드는 캐시 파일 EPERM으로 실패한다. | next.config.ts:15,18, tsconfig.json, 아래 실행 결과 |

포인트 흐름은 FA_AD_CRUD_FLOW 및 FA_BIZ_AD_CRUD_FLOW에서 실제 호출한다. 문서 points_process.md는 이를 트랜잭션으로 설명하지만 코드에서 요청들을 하나의 DB 트랜잭션으로 묶는 경계는 확인되지 않았다. 데이터 중복·잔액 손실·정보 유출이 실제 발생했다고 단정하지 않는다. DB 트리거·제약·RLS·운영 키·구독 상태는 미확인이다.

C06은 middleware 경계에 한정한다. 모든 하위 페이지/API의 접근 권한이 함께 우회된다는 주장이 아니다. C02도 supabaseAdmin이 항상 관리자 권한이라는 주장이 아니다. lib/supabase.ts:9는 키가 없으면 anon 키를 사용한다.

## 실제 검사 결과

- 타입: `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false` 종료 1. 오류 20건, 8파일.
  - 관리자 포인트 history 7건, test-proxy-ip 1건, scratch/get_service_id 4건, FA_USER_SETTINGS_FLOW 1건, QA_GET_ADMIN_USERS 1건, QA_GET_SUPPORT_STAFF_USERS 2건, QA_PORTONE_GET_CERTIFICATION 1건, QA_GET_SEEKER_AD_BY_ID 3건.
  - scratch 오류 4건도 포함되므로 전부 사용자 화면 장애라고 해석하지 않는다.
  - FA_USER_SETTINGS_FLOW.ts:113은 문자열을 받는 QA_GET_USER_PROFILE에 객체를 전달한다. 실제 조회 실패 여부는 사용자 시나리오에서 추가 확인이 필요하다.
- 린트: ESLint API로 app, src, lib, actions, components, middleware.ts, auth.ts, auth.config.ts를 검사했다. 456파일, 오류 923건, 경고 459건. 규칙별 메시지는 no-explicit-any 764건, rules-of-hooks 70건 등이다. 모두 실제 장애 건수라는 의미는 아니다.
- 뽑기 컴포넌트 단독 검사: react-hooks/rules-of-hooks 오류 1건, line 190 확인. 브라우저 재현은 미실행.
- 빌드: `npm run build` 일반 실행과 승인된 샌드박스 밖 실행 모두 `.next/cache/.rscinfo` open EPERM으로 종료 1. eslint 설정 미지원 경고도 출력됐다. 파일 속성은 Hidden, Archive였다. 잠금·ACL·속성 중 정확한 원인은 확정하지 않았으며 과거 답변의 "파일 잠금 확정" 표현을 정정한다.
- package.json에 test 스크립트는 없다. 테스트 파일 자체가 전무하다고 판단한 것은 아니다. DB를 쓸 수 있는 scratch/test 스크립트는 실행하지 않았다.
- 과거 2026-09-03의 전체 lint 1,873건은 이번 456파일 검사와 범위가 다르며 감소나 수정 성과로 비교할 수 없다.
- 새 스킬 4개: 설치된 js-yaml로 YAML·폴더명/스킬명·설명·미완성 자리표시자를 검사해 통과했다. 핵심 참조 12개 존재와 git diff --check도 통과했다. skill-creator의 공식 quick_validate.py는 번들 Python에 PyYAML이 없어 실행 실패했으며 공식 검사 통과로 보고하지 않는다.

## 범위와 남은 확인

로컬 HEAD는 ad417be388111b62f1f64435446b1062baf876e5(커밋 시각 2026-08-14T11:54:14+09:00)다. 운영 배포가 이 HEAD와 같은지는 확인하지 않았다. 기존 check_schema.js, get_schema.js 수정과 다수 미추적 scratch 파일을 보존했다. 앱 소스·의존성은 변경하지 않았다. 지침·문서의 의도된 변경 외 baseline drift는 최종 diff에서 확인한다.

기존 known-list: 무인증 유지보수 API·푸시, 타입/빌드 문제, 조건부 Hook, 키 ZIP 추적 의심, HTML 정화 여부, KMC Mock 운영 플래그, 사업자 Cron 미구현. 이번에는 C02~C08 범위를 재검증했다. 키 ZIP 내용·실제 운영 KMC 플래그·저장형 XSS의 전체 저장/출력 경로·운영 Cron 동작은 이번 검증 완료 항목이 아니다. 오픈 문서 체크박스만으로 결제나 성인인증 미구현을 확정하지 않는다.

신규-1(REVIEWER 제시, PRIMARY 직접 재확인): 기존 .rules/00_master_router.md에 평문 테스트 자격증명이 있었다. 현행 라우터에서 값은 제거했으나 과거 Git 이력·계정 유효성·노출 피해는 미확인이다. 계정 변경이나 Git 이력 재작성은 수행하지 않았다.

이번에 구체화한 위험: 대화방 밖 푸시 본문 전달, 포인트 부분 저장/동시 갱신, 조회 중 보정 이력 쓰기, 무서명 게스트 쿠키와 존재 검사. 운영 수정 단계에서는 인증된 테스트 환경에서 각각 권한 거절·대상 제한·중간 실패·동시 요청·정상 기능 회귀를 검증해야 한다.

## 반박검증 기록

mode: 지침 change-authorized / 앱 verification-only. PRIMARY /root, 유일 REVIEWER /root/rebuttal_reviewer. 동일 로컬 파일 시스템에서 READ-ONLY 검토. AI 합의는 운영 안전 보증이 아니다.

R1 Claim Ledger:

| ID | scope | conclusion | evidence | counterevidence | status |
|---|---|---|---|---|---|
| C01 | 지침 이식 | 폭스몬 맞춤 루트 지침·4스킬·라우터·인수인계·보고서 계획 적합, 구현 전 | 양측 원본 직접 읽기 | LIFORY LEVEL 폐지·Vite·schema 경로는 제외 | 미해결(구현 미검증) |
| C02 | 유지보수 API | 인증 없는 쓰기 경로 | 위 route/middleware | 운영 권한/외부 차단 미확인 | 확인 |
| C03 | 푸시 | 인증/방 필터 없고 본문 전달 | route 및 호출자 | 실사용 구독/키 미확인 | 확인 |
| C04 | 포인트 | 다중 요청 원자성/보상 부재 | OA·FA·광고 호출 | DB 트리거/동시 실측 미확인 | 확인 |
| C05 | 포인트 QA | 조회 도중 INSERT·실패 무시 | QA 전체 코드 | 실제 제약 미확인 | 확인 |
| C06 | 게스트 경계 | 존재 검사·무서명 값 | middleware·발급 OA | 개별 API 검증 범위 밖 | 확인 |
| C07 | 뽑기 | 조건부 Hook | component·호출자 | 브라우저 미실행 | 확인 |
| C08 | 빌드/검사 | 타입 오류 무시 설정·test 스크립트 부재 | package·config | 과거 검사는 현재 실측 아님 | 확인 |

R1 REVIEWER 판정은 모든 Claim 반박 근거 없음. PRIMARY가 각 코드와 신규-1 원문을 직접 재확인하여 수용했다.

PRIMARY APPROVES R1

REVIEWER APPROVES R1

REBUTTAL_CHECKPOINT {"primary_task":"/root","reviewer_agent_id":"/root/rebuttal_reviewer","reviewer_task":"/root/rebuttal_reviewer","working_directory":"C:/Antigravity_Google/Foxmon","round":1,"ledger":"R1"}

RESULT LEDGER R2:

| ID | scope | conclusion | evidence | counterevidence | status |
|---|---|---|---|---|---|
| C01 | 지침 이식 | 루트 2문서·4스킬·라우터·인수인계·보고서 구현, 앱 기능 불변 | 생성 파일·diff·검증 결과 | 전역 설치/앱 자동 등록 미검증 | 확인 |
| C02 | 유지보수 API | 인증 없는 쓰기 경로 유지, 미수정 | 같은 route/middleware | 운영 권한/외부 차단 미확인 | 확인 |
| C03 | 푸시 | 인증/방 필터 없고 본문 전달, 미수정 | 같은 route·호출자 | 실제 유출 미확인 | 확인 |
| C04 | 포인트 | 다중 요청 원자성/보상 부재, 미수정 | 같은 OA·FA | DB 동시 실측 미확인 | 확인 |
| C05 | 포인트 QA | 조회 중 쓰기·실패 무시, 미수정 | 같은 QA | 실제 중복 미확인 | 확인 |
| C06 | 게스트 경계 | 존재 검사·무서명 값, 미수정 | 같은 middleware·OA | 개별 API 검증 범위 밖 | 확인 |
| C07 | 뽑기 | 조건부 Hook, 미수정 | 직접 코드·단독 ESLint | 브라우저 미실행 | 확인 |
| C08 | 빌드/검사 | 20 타입 오류·대상 lint 오류923/경고459·두 빌드 EPERM 재현, 미수정 | 위 2026-09-08 실행 결과 | EPERM 원인·배포 빌드 상태 미확인 | 확인 |

증거 등급: C01~C06 코드/문서 확인과 제한된 논리, C07~C08 정적 검사 실행 실측. 운영 데이터/브라우저 실측 없음.

Round 2: 동일 REVIEWER가 생성 문서·4스킬·라우터·보호할 UI 제약과 HEAD를 독립 확인하고 diff --check를 실행했다. C01~C08에 반박 근거 없음으로 승인했다. 실행 수치는 PRIMARY의 실측이며 REVIEWER의 독립 재실행 결과가 아니라는 한계를 유지한다. PRIMARY도 생성 파일·핵심 참조와 diff를 직접 확인해 결과를 수용했다. 추가 blocking 발견 없음. 앱 소스·의존성 기준 변경 없음, 문서 변경만 의도된 차이다.

PRIMARY APPROVES R2

REVIEWER APPROVES R2

REBUTTAL_CHECKPOINT {"primary_task":"/root","reviewer_agent_id":"/root/rebuttal_reviewer","reviewer_task":"/root/rebuttal_reviewer","working_directory":"C:/Antigravity_Google/Foxmon","round":2,"ledger":"R2"}

지침 구현과 범위 내 진단 검증은 완료했다. 이 판정은 앱 결함 수정이나 정식 오픈 승인이 아니다. 운영 확인은 별도 미검증 항목으로 남는다.
