# 폭스몬 작업 인수인계

갱신일 2026-09-08. 기준 HEAD ad417be388111b62f1f64435446b1062baf876e5. 최신 상태는 git status로 재확인한다.

- 이전 완료: LIFORY 지침을 폭스몬 AGENTS.md·PROJECT_GUIDE.md·프로젝트 스킬 4개·라우터로 적용. 과거 진단은 docs/audits/2026-09-08-launch-review.md.
- 이번 요청: “프로그램 오류가 있으면 수정을해”. LEVEL 3, 로컬 수정 허용. 운영 DB 변경·배포·커밋·push 없음.
- 수정: 운영 보정/Cron 인증, 게스트 JWE·가입 역할/서버 신원, 폭스톡 참여·작성·수신자 및 여성 회원 LIVE 권한, QA 포인트 보정 쓰기 제거·금액 검증, 타입 오류 20개, 종이뽑기/위젯 조건부 Hook, 빌드 오류 숨김 설정.
- 최종 실측: 회귀 테스트 13개 통과(외부 I/O 격리), 전체 tsc exit 0, 최종 빌드 exit 0(컴파일 61초·정적 페이지 82개), 두 변경 UI 파일 Hook 오류 0. 신규 공통 모듈 4개 lint 오류/경고 0. 기존 기타 lint 오류와 의존성 취약점은 남음.
- 빌드 캐시 .rscinfo/.previewinfo의 Hidden 속성만 해제하여 EPERM 해결. 자동 생성 PWA 산출물은 소스 수정과 분리하여 원복. 다음 배포/실행 검증 시 재빌드한다.
- 검증: 동일 REVIEWER /root/rebuttal_reviewer (Socrates). 5 Round 후 PRIMARY APPROVES R5 / REVIEWER APPROVES R5. 국소 수정과 C04 미해결 합의. REVIEWER 독립 테스트는 샌드박스 초기화 실패이며 13개 통과는 PRIMARY 실행 증거다. 상세 결과는 docs/audits/2026-09-08-launch-fixes.md 참조.
- 미해결: 포인트 다중 쓰기 트랜잭션/광고 저장 실패 보상, 전체 QA/RLS/기존 참여행 오염, 실제 가입·인증·푸시·채팅 브라우저 회귀, 사업자 상태 Cron 본체 TODO.
- 환경 차단: DB 연결 28P01, SUPABASE_SERVICE_ROLE_KEY와 CRON_SECRET 미설정, NEXT_PUBLIC_KMC_TEST_MODE=true. AUTH_SECRET은 존재. 비밀값을 채팅에 보내지 말고 정상 운영 환경설정을 준비해야 한다. 공개 Supabase 조회 성공과 관리자 DB 검증 성공을 혼동하지 않는다.
- 사용자 기존 변경 check_schema.js, get_schema.js와 여러 scratch/보조 파일을 보존. scratch/get_service_id.ts는 기존 전역 crypto 타입 충돌을 막는 export {} 한 줄만 추가했고 실행하지 않았다.
- 오픈 승인 아님. 구체적인 파일 목록·검증 한계·Ledger는 docs/audits/2026-09-08-launch-fixes.md.
