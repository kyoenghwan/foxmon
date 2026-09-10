---
name: foxmon-design-system
description: 폭스몬의 UI·배너·모바일·이미지 작업에서 기존 공통 스타일과 반응형 동기화 제약을 적용한다.
---

# 폭스몬 UI 규칙

폭스몬 루트 기준이다. AGENTS.md의 검증 절차를 따른다.

1. docs/project_map.yaml과 실제 components 또는 src/components 경로를 대조한다. app/globals.css, tailwind.config.ts와 유사 UI를 확인한다.
2. 배너는 docs/project_rules/banner_responsive_sync.md를 읽는다. 메인 3:2·사이드 2:3 비율, 사이드 폭과 메인 높이의 연결, 컨테이너 공간을 함께 검증한다.
3. 모바일은 docs/project_rules/03_mobile_viewport_scaling.md와 src/components/layout/MaxWidthWrapper.tsx를 읽는다. MOBILE_TRIGGER=425, MOBILE_RENDER_WIDTH=390 및 관리자 예외를 임의 변경하지 않는다. 425px 미만 개별 CSS로 이중 축소하지 않는다. 배너 문서의 과거 424px 개별 규칙과 충돌하면 전용 모바일 규칙을 우선하고 실제 구현 차이를 보고한다.
4. 업로드는 docs/project_rules/02_image_optimization_rules.md에 따라 WebP 품질 80과 애니메이션 프레임을 보존한다. 비이미지 증빙은 별도 처리한다. 변환 오류를 성공처럼 숨기지 않는다.
5. 모달 닫기는 명시적인 "닫기" 텍스트를 사용한다. 한국어 길이, 오류·빈 상태·로딩 상태, 키보드 포커스를 확인한다.
6. Hooks는 조건문·조기 반환보다 앞에서 동일 순서로 호출한다. 주요 변경은 모바일/데스크톱의 겹침·넘침과 관련 상호작용을 검증한다. SEO 작업은 docs/project_rules/01_seo_optimization_rules.md도 읽는다.

LIFORY의 테마·색상·Vite 경로를 복제하지 않는다. 공유 스타일의 영향은 사용자 요청으로 범위가 명확하면 스스로 판단하고, 중요한 미결정 선택만 질문한다.
