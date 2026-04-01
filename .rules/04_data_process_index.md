# Part 4: 전방위 UI 색인 맵 & 파급 범위 제어 프로토콜

## 4.1 전방위 AI용 프로젝트 색인 맵 (핵심 기능)

### 색인 맵 파일 구조 (`docs/project_map.yaml`)

```yaml
# 1. 전역 공통 컴포넌트 (공유 스타일)
global_components:
  TOP_NAVIGATION:
    label: "상단 네비게이션 바"
    keywords: ["상단 메뉴", "네비게이션", "메뉴바"]
    shared_style: true
    style_group: "NAV_MENU_ITEMS"
    files: ["src/components/layout/TopNav.tsx"]
    elements:
      - name: "HOME_MENU"
        keywords: ["홈", "home", "첫화면"]
        selector: ".nav-item.home"
        type: "nav-item"
      - name: "JOB_MENU" 
        keywords: ["구인정보", "jobs", "채용"]
        selector: ".nav-item.jobs"
        type: "nav-item"
      - name: "TALENT_MENU"
        keywords: ["인재정보", "talent"]
        selector: ".nav-item.talent"
        type: "nav-item"
      - name: "COMMUNITY_MENU"
        keywords: ["커뮤니티", "community"]
        selector: ".nav-item.community"
        type: "nav-item"
      - name: "SUPPORT_MENU"
        keywords: ["고객센터", "support"]
        selector: ".nav-item.support"
        type: "nav-item"

# 2. 페이지별 세부 UI 요소
pages:
  LOGIN_MODAL:
    label: "로그인 모달"
    keywords: ["로그인", "로그인창", "회원로그인"]
    files: ["src/components/auth/LoginModal.tsx"]
    flows: ["FA_LOGIN_FLOW"]
    ui_elements:
      - name: "HEADER_LOGO_TEXT"
        keywords: ["FOXMON", "상단 텍스트", "로고"]
        selector: ".login-logo-text"
        type: "text"
        style_group: "BRAND_LOGO_TEXT"
        i18n_key: "auth.login.logo"
        responsive_variants:
          - viewport: "desktop"
            selector: ".login-logo-text--desktop"
          - viewport: "mobile"
            selector: ".login-logo-text--mobile"
      - name: "SUBTITLE_TEXT"
        keywords: ["신뢰할 수 있는 구인구직", "슬로건"]
        selector: ".login-subtitle"
        type: "text"
        i18n_key: "auth.login.slogan"

  JOB_LIST_PAGE:
    label: "구인 목록 페이지"
    keywords: ["구인 목록", "채용공고 리스트", "jobs 페이지"]
    files: 
      - "src/pages/jobs.tsx"
      - "src/components/jobs/JobList.tsx"
    flows: ["FA_JOB_SEARCH_FLOW"]
    db_tables: ["jobs", "companies"]

  JOB_DETAIL_PAGE:
    label: "채용공고 상세 페이지"
    keywords: ["채용공고 상세", "job detail", "구인 상세"]
    files:
      - "src/pages/jobs/[id].tsx"
      - "src/components/jobs/JobDetail.tsx"
    flows: ["FA_GET_JOB_DETAIL_FLOW", "FA_APPLY_JOB_FLOW"]
    db_tables: ["jobs", "applications"]
```

## 4.2 AI 동작 프로토콜 (전방위 타겟팅)

### 단순 텍스트 수정 시나리오
**사용자**: "로그인의 FOXMON 텍스트를 여우알바로 바꿔줘"

**AI 응답**:
```text
📌 색인 맵에서 후보를 찾았습니다:

- 요소: HEADER_LOGO_TEXT
- 위치: src/components/auth/LoginModal.tsx (.login-logo-text)
- 현재 텍스트: "FOXMON" (i18n: auth.login.logo)
- 변경 텍스트: "여우알바"
- 반응형: 데스크톱/모바일 변형 존재

다국어 처리 방법:
1) 한국어만 변경 (i18n 파일 수정)
2) 모든 언어 공통 텍스트로 변경 (컴포넌트 하드코딩)

어떻게 진행할까요? (1/2)
```

### 공유 스타일 파급 범위 제어 시나리오
**사용자**: "홈 메뉴 글자 크기를 20px로 키워줘"

**AI 응답**:
```text
📌 색인 확인 결과, 'HOME_MENU'는 'NAV_MENU_ITEMS' 스타일 그룹을 공유합니다.

⚠️ 동일한 스타일을 공유하는 메뉴들:
- 홈 (HOME_MENU)
- 구인정보 (JOB_MENU)  
- 인재정보 (TALENT_MENU)
- 커뮤니티 (COMMUNITY_MENU)
- 고객센터 (SUPPORT_MENU)

어떻게 적용할까요?
1) '홈' 메뉴만 단독으로 20px 적용 (예외 스타일)
2) 상단 네비게이션 메뉴 그룹 전체를 20px로 일괄 변경

선택: (1/2)
```

### 색인 누락 시 처리
**사용자**: "회원가입 버튼 색깔 바꿔줘"

**AI 응답**:
```text
❌ '회원가입 버튼'에 대한 색인 정보가 없습니다.

이 버튼이 어느 위치에 있는지 알려주세요:
1) 로그인 모달 내부
2) 별도 회원가입 페이지
3) 기타 위치

위치를 확인한 후 색인 엔트리를 먼저 생성하고 수정하겠습니다.
```

## 4.3 색인 생성/업데이트 강제 규칙

### 신규 요소 생성 시 절차
1. **색인 엔트리 초안 작성**
2. **사용자 승인 요청**
3. **승인 후에만 실제 코드 구현**

```text
📝 새 UI 요소용 색인 엔트리를 작성했습니다:

- 요소명: REGISTER_BUTTON
- 위치: src/components/auth/RegisterForm.tsx (.register-btn)
- 설명: 회원가입 제출 버튼
- 스타일 그룹: PRIMARY_BUTTONS

이 구성이 맞습니까? (예/수정)
```

## 4.4 DB 스키마 관리 프로토콜

### 저장 규칙
- **경로**: `docs/db/[테이블명]_schema.md`
- **수정 순서**: 스키마 문서 업데이트 → 버전 증가 → 코드 반영

### 템플릿
```markdown
# Table: users
* **Version:** v1.2
* **Last Updated:** 2026-03-21

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 사용자 ID |
| `email` | String | Unique, Not Null | 로그인 이메일 |
```

## 4.5 프로세스 청사진 프로토콜

### 저장 규칙
- **경로**: `docs/processes/[프로세스명]_process.md`

### 템플릿
```markdown
# Process: 사용자 인증
### 1. 화면 흐름
[로그인 모달] → [회원가입 모달] → [대시보드]

### 2. 연결된 FA
- FA_LOGIN_FLOW
- FA_USER_REGISTRATION_FLOW

### 3. 연관 DB
- users (조회/생성)
- sessions (생성)
```

## 4.6 추가 고려 사항

### 반응형 대응
- `responsive_variants`로 모바일/데스크톱 구분
- 수정 시 "어느 뷰포트에 적용할지" 확인

### 다국어 대응
- 텍스트 요소에 `i18n_key` 포함
- "한국어만 vs 모든 언어" 선택권 제공

### 색인 자동화 도구 연동
- 추후 novague에서 컴포넌트 스캔 → 색인 초안 생성 기능 제공 예정
- AI는 항상 최종 승인된 `docs/project_map.yaml`만 신뢰
