---
name: foxmon-work-continuity
description: 폭스몬을 다른 PC에서 열거나 이전 작업을 이어갈 때 Git 상태와 실제 검증·미완료 항목을 대조한다.
---

# 폭스몬 작업 이어가기

폭스몬 전용이며 루트 AGENTS.md를 따른다.

1. AGENTS.md와 agent-kit/CURRENT_STATE.md를 읽는다. 관련 기술 문서만 추가로 읽는다.
2. git status --short --branch, git log -5 --oneline으로 실제 상태를 확인한다. 과거 요약을 현재 상태로 단정하지 않는다.
3. 사용자 미커밋 변경을 보존하고 강제 reset·자동 병합을 하지 않는다. 의존성 설치는 lockfile과 설치 상태를 확인한 뒤 필요한 경우에만 한다.
4. 완료·미완료·검증·다음 작업이 바뀌면 CURRENT_STATE.md를 갱신한다. 진단은 docs/audits의 근거 문서로 연결한다. 비밀값·실사용 계정 정보는 적지 않는다.
5. 커밋·push·배포는 각각 사용자 요청 범위에서 수행하고 성공 여부를 구분한다. 이 프로젝트의 스킬 원본은 agent-kit/skills이며 AGENTS.md가 읽기 경로를 지정한다. 전역 설치나 LIFORY 파일 수정은 필요 없다.
