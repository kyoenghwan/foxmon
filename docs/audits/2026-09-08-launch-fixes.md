# 폭스몬 오픈 전 오류 수정 기록

## 범위와 판정

사용자 요청: “프로그램 오류가 있으면 수정을해”. LEVEL 3, change-authorized.
운영 DB 변경·배포·커밋·push는 수행하지 않는다. 모든 오류 해결 또는 오픈 가능 판정이 아니다.
기준 HEAD: ad417be388111b62f1f64435446b1062baf876e5. 기존 사용자 수정 check_schema.js/get_schema.js 및 scratch 파일을 보존한다.
DRIFT DETECTED: 승인된 앱 소스 수정, jose 6.1.3 직접 의존성, tsx 4.20.6 개발 의존성 및 회귀 테스트 추가.

## Claim Ledger

| ID | 범위·주장 | 결론·증거 | 반례·한계 | 상태 |
|---|---|---|---|---|
| C01 | 운영 보정 API와 Cron 인증 | GET 보정은 405, POST는 동일 출처·로그인·최신 DB 관리자 역할 검사. Cron 비밀값 누락/불일치 거절. 격리 테스트 2개 통과 | 실제 관리자 호출/운영 Cron 미검증. check-biz-status 사업자 검사 본체는 기존 TODO | 수정 |
| C02 | 폭스톡 작성·참여·퇴장·푸시 권한 | 서버 actor와 방 권한 확인. 1:1 실제 당사자 검사, SECRET 서버 비밀번호 확인, LIVE 여성 회원 검사. 푸시는 저장 메시지 작성자 확인 후 해당 방의 상대만 수신. 격리 테스트 4개 통과 | 전체 조회 QA·브라우저 직접 조회·RLS·과거 참여행 오염 미검증. SECRET 저장 비밀번호 평문은 그대로이며 기밀성 보장 완료 아님. 실제 알림/브라우저 미검증 | 수정 |
| C03 | 비회원 본인인증과 가입 역할·신원 | 목적별 키로 암호화한 만료 JWE, 실제 날짜 검사, raw 인증 차단, PortOne 완료 상태 확인, 운영 KMC mock 차단. 가입은 GENERAL/EMPLOYER 및 서버 인증 신원·CI만 사용. 토큰/날짜 3개·가입 저장 직전 경계 2개 테스트 통과 | 실제 KMC/PortOne 성공과 전체 가입 저장·추천 포인트 지급 미검증. 기존 쿠키는 재인증 필요 | 수정 |
| C04 | 포인트 차감 | QA의 숨은 보정 INSERT 제거, 잔액/이력 불일치 명시. 음수/NaN/소수/중복 이력 거절, FIFO 테스트 2개 통과 | DB 접속 28P01, 서비스 역할 키 미설정. 차감 다중 쓰기 원자성과 광고 저장 실패 시 보상은 미수정. 결제 안전 보증 불가 | 미해결 |
| C05 | 타입·Hook 오류 | 기존 타입 오류 20개 해결, RetroDrawGame 조건부 Hook 수정. 위젯은 외부 경로 판정 컴포넌트와 내부 Hook 컴포넌트로 최소 분리 | 실제 화면 전환 검증 미실행. 최종 검사 결과 아래 기록 | 수정 |
| C06 | 오류를 숨기지 않는 빌드 | ignoreBuildErrors와 지원하지 않는 eslint 설정 제거. 숨김 캐시 파일 2개 속성 해제 후 최종 위젯 수정 포함 빌드 exit 0 (컴파일 61초, 페이지 82개) | middleware 명칭·metadataBase·Browserslist·FAQ 정적 렌더 시 동적 사용 로그 등 기존 경고 유지. 배포 검증 아님 | 수정 |

## 변경 파일

- 인증: lib/guest-session.ts, middleware.ts, src/atoms/oa/auth/OA_CREATE_GUEST_SESSION.ts, src/atoms/fa/auth/FA_GUEST_AUTH.ts, src/atoms/fa/auth/FA_REGISTER_FLOW.ts, src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA.ts, src/atoms/qa/auth/QA_PORTONE_GET_CERTIFICATION.ts, app/api/auth/kmc/route.ts, app/api/auth/register/route.ts.
- 운영 API: lib/api-authorization.ts, app/api/fix-side-ads/route.ts, app/api/migrate-constraint/route.ts, app/api/cron/auto-jump/route.ts, app/api/cron/check-biz-status/route.ts.
- 채팅: lib/chat-authorization.ts, lib/chat-push.ts, app/api/push/send/route.ts, components/chat/foxtalk-widget.tsx, src/atoms/qa/foxtalk/QA_GET_CHAT_ACTOR.ts, src/atoms/qa/foxtalk/QA_GET_CHAT_ROOMS.ts, src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM.ts, OA_INSERT_CHAT_PARTICIPANT.ts, OA_INSERT_CHAT_MESSAGE.ts, OA_LEAVE_CHAT_ROOM.ts.
- 포인트: src/atoms/qa/points/QA_GET_DEDUCTION_CONTEXT.ts, src/atoms/ra/points/RA_CALC_DEDUCTION_FIFO.ts.
- 타입·화면·빌드: tsconfig.json, next.config.ts, scratch/get_service_id.ts, src/atoms/fa/auth/FA_USER_SETTINGS_FLOW.ts, src/atoms/qa/admin/QA_GET_ADMIN_USERS.ts, QA_GET_SUPPORT_STAFF_USERS.ts, src/atoms/qa/resume/QA_GET_SEEKER_AD_BY_ID.ts, src/components/game/RetroDrawGame.tsx, app/(admin)/fox-office/points/history/page.tsx, package.json, package-lock.json.
- 검증·문서: tests/launch-regression.test.ts, tests/security-boundaries.test.mts, tests/chat-security.test.mts, tests/signup-security.test.mts, docs/project_map.yaml, 본 문서, agent-kit/CURRENT_STATE.md.

## 검증 증거와 한계

- `npm run test:launch`: 13개 통과. DB·인증·푸시 I/O 대역은 테스트 안에서만 사용했다. 운영 코드에 mock/fallback을 추가하지 않았다.
- 가입 테스트는 실제 함수가 서버 인증 신원을 사용자 생성 경계로 전달함을 확인하고 저장 직전에 종료한다. 가입 전체 성공 테스트가 아니다.
- `npx tsc --noEmit --incremental false`: 최종 위젯 분리와 테스트 import 수정까지 포함하여 exit 0 통과. 기존 타입 오류 20개 제거. 테스트 작성 중 TS5097 발생은 확장자 import 제거로 해결했다.
- 최초 빌드 EPERM은 .next/cache/.rscinfo와 .previewinfo의 Hidden 속성과 관련됐다. 기존 파일 r+ 열기는 성공했고, 해당 파일의 Hidden만 해제하자 컴파일·타입·82개 페이지 생성·빌드 종료까지 성공했다. 파일 내용 삭제·캐시 전체 삭제를 하지 않았다.
- ESLint: 신규 공통 모듈 4개 오류/경고 0. RetroDrawGame Hook 순서 오류 0, 기존 any 오류 2/경고 7은 남음. 위젯 Hook 오류는 60개에서 0개로 감소했고 기존 기타 오류 25/경고 10은 남았다. 외부/내부 두 컴포넌트를 포함한 파일 전체 Hook 검사 결과다. 전체 lint 정상이라고 주장하지 않는다.
- 의존성 설치 출력의 npm audit: 35개(critical 4/high 24/moderate 5/low 2). 악용 가능성/운영 영향은 상세 조사하지 않았고 무조건적 audit fix 또는 메이저 업그레이드는 하지 않았다.
- Supabase 공개 조회는 빌드 중 응답했지만 관리자 키는 미설정이다. 공개 조회 성공을 관리자 DB 검증 성공으로 간주하지 않는다.
- 현재 로컬 환경설정의 값 노출 없는 존재 검사: AUTH_SECRET 설정됨, SUPABASE_SERVICE_ROLE_KEY/CRON_SECRET 미설정, NEXT_PUBLIC_KMC_TEST_MODE=true. 이 상태에서는 새 보호장치가 관리자 보정·Cron·운영 KMC 테스트 인증을 거절한다. 운영 인증 설정을 정상화해야 하며 테스트 모드를 켠 채 배포하면 안 된다.
- 최종 빌드 종료 후 public/sw.js는 HEAD와 동일하게 복원했다. 기존 worker-OVWFD09QnTzq9CGcHr3iT.js는 HEAD 본문으로 복원했으며 파일 끝 개행 1개만 차이로 남는다(동작 변경 없음). 이번 빌드가 만든 worker-UQ0PFXQ6jf7ECqU4cCYWY.js만 제거했다. 재빌드로 재생성 가능하다. 배포할 때 반드시 다시 빌드한다.

## 반박검증 이력

REVIEWER: /root/rebuttal_reviewer (Socrates), 동일 READ-ONLY 검토자 유지.

- R1: 채팅 참여행 자체가 위조 가능하고 DB 트랜잭션 계약 불명확하다는 반박을 PRIMARY가 코드로 재확인·수용. 계획 보완.
- R2: 서버 actor·방 권한·푸시 수신자 연계, DB 차단 시 원자성 미해결 명시 계획 합의. PRIMARY APPROVES R2 / REVIEWER APPROVES R2.
- R3: 구현 결과 검토. LIVE 여성 회원 정책 누락을 PRIMARY가 UI 코드로 직접 재확인·수용. 승인 보류. senderName ID 비교도 직접 확인해 수정.
- R4: LIVE 보완 테스트 통과 및 위젯 Hook 경계 추가 수정계획 합의. PRIMARY APPROVES R4 / REVIEWER APPROVES R4. 이후 승인된 컴포넌트 분리를 구현했다.
- R5: 최종 소스의 타입 검사·13개 회귀 테스트·빌드 exit 0, 위젯/뽑기 Hook 오류 0을 제출. PRIMARY APPROVES R5 / REVIEWER APPROVES R5. 국소 수정과 C04 미해결 상태로 합의했으며 오픈 승인이 아니다.
- REVIEWER 독립 diff --check는 통과했다. REVIEWER의 테스트 재실행은 샌드박스에서 tsx 초기화 중 uv_os_get_passwd ENOMEM으로 본문 실행 전에 실패했다. PRIMARY도 같은 제한을 확인한 후 승인된 샌드박스 밖 로컬 실행으로 13개 통과를 확인했다. 따라서 테스트 통과는 PRIMARY 실행 증거이며 REVIEWER 독립 통과가 아니다.

REBUTTAL_CHECKPOINT {"primary_task":"/root","reviewer_agent_id":"/root/rebuttal_reviewer","reviewer_task":"/root/rebuttal_reviewer","working_directory":"C:/Antigravity_Google/Foxmon","round":5,"ledger":"R5"}

검증 등급: 직접 코드 확인·실행 테스트·빌드 결과. REVIEWER 의견은 PRIMARY가 재확인한 부분만 수용한다. AI 간 합의는 운영 안전의 증거가 아니다.

## 남은 오픈 차단 사항

1. 유효한 폭스몬 DB 연결 및 서버 관리자 키를 안전한 환경설정으로 제공한 뒤 스키마·권한·포인트 트랜잭션을 검증해야 한다. 비밀값은 채팅에 공유하지 않는다.
2. 차감과 거래 이력 쓰기를 단일 트랜잭션으로 처리하고 광고 등록 실패/중복 요청/동시 차감을 검증해야 한다.
3. 정상·타인·비회원 계정으로 실제 가입, 채팅, 푸시, 광고 등록을 검증하고 전체 조회/RLS 경계를 확인해야 한다.
4. 기존 lint/의존성 취약점과 미구현 사업자 상태 Cron은 별도 정리가 필요하다.

운영 배포는 사용자 승인 후 별도로 수행한다.
