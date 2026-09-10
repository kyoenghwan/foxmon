# 폭스몬 작업 인수인계

갱신일 2026-09-11. 기준 HEAD 3eb6c8df964fcb74074bde3b490f5e060d43326d. 최신 상태는 git status로 재확인한다.

- 완료 내역:
  1. 보안 경계 강화, 인증/톡 시스템 최적화, 지침 개정 (`fb9a512`)
  2. Vercel 빌드 중단 원인이었던 `scratch/get_service_id.ts`의 crypto 블록 스코프 충돌 ESM import 수정 및 scratch 스크립트 동기화 (`3eb6c8d`)
  3. 로컬 `tsc --noEmit` 통과 및 `npm run build` 성공 검증 완료 후 `origin/main` push 완료.
- 집 PC 작업 이어가기 요령:
  1. `git pull origin main` 수행 시 로컬 파일과 원격이 100% 일치합니다.
  2. `.env.local` 등 로컬 환경설정 파일과 KMC 키(`keys/`) 파일은 보안상 `.gitignore` 처리되어 있으므로, 집 PC에 해당 파일들이 동일하게 존재하는지 확인 필요합니다.
- 이전 진단 및 감사 문서: `docs/audits/2026-09-08-launch-fixes.md`, `docs/audits/2026-09-08-launch-review.md`

