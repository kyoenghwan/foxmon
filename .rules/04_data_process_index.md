# Part 4: 전방위 UI 색인 맵 & 파급 범위 제어 프로토콜

## 4.1 전방위 AI용 프로젝트 색인 맵 (핵심 기능)

### 4.1.1 색인 맵 파일 구조 (`docs/project_map.yaml`)

```yaml
# 1. 전역 공통 컴포넌트 (공유 스타일 그룹)
global_components:
  [TOP_NAVIGATION]:
    label: "상단 네비게이션 바"
    keywords: ["상단 메뉴", "네비게이션", "메뉴바"]
    shared_style: true
    style_group: "[NAV_MENU_ITEMS]"
    files: ["src/components/layout/[TopNav].tsx"]
    triggers: ["TA_[NAV_ROUTE_CHANGE]"]          # 연결된 Trigger Atom
    events: ["EA_[PAGE_NAVIGATED]"]              # 연결된 Event Atom
    elements:
      - name: "[MENU_ITEM_HOME]"
        keywords: ["홈", "home", "첫화면"]
        selector: ".nav-item.home"
        type: "nav-item"
      - name: "[MENU_ITEM_1]"
        keywords: ["[메뉴1명]", "[메뉴1_영문]", "[메뉴1_설명]"]
        selector: ".nav-item.[menu1]"
        type: "nav-item"
      - name: "[MENU_ITEM_2]"
        keywords: ["[메뉴2명]", "[메뉴2_영문]", "[메뉴2_설명]"]
        selector: ".nav-item.[menu2]"
        type: "nav-item"
      - name: "[MENU_ITEM_3]"
        keywords: ["[메뉴3명]", "[메뉴3_영문]", "[메뉴3_설명]"]
        selector: ".nav-item.[menu3]"
        type: "nav-item"
      - name: "[MENU_ITEM_4]"
        keywords: ["[메뉴4명]", "[메뉴4_영문]", "[메뉴4_설명]"]
        selector: ".nav-item.[menu4]"
        type: "nav-item"

# 2. 페이지별 세부 UI 요소 및 8-Atom 연결
pages:
  [AUTH_MODAL]:
    label: "인증 모달 (로그인/회원가입)"
    keywords: ["로그인", "로그인창", "회원로그인", "auth"]
    files: ["src/components/auth/[AuthModal].tsx"]
    flows: ["FA_[AUTH_LOGIN_FLOW]", "FA_[AUTH_REGISTER_FLOW]"]
    triggers: ["TA_[AUTH_SESSION_CLEANUP]"]
    events: ["EA_[LOGIN_SUCCESS]", "EA_[LOGIN_FAILED]", "EA_[USER_REGISTERED]"]
    db_tables: ["[users_table]", "[sessions_table]"]
    ui_elements:
      - name: "[BRAND_LOGO_TEXT]"
        keywords: ["[서비스명]", "상단 텍스트", "로고", "브랜드"]
        selector: ".[auth-logo-text]"
        type: "text"
        style_group: "[BRAND_LOGO_TEXT_GROUP]"
        i18n_key: "auth.brand.logo"
        responsive_variants:
          - viewport: "desktop"
            selector: ".[auth-logo-text]--desktop"
          - viewport: "mobile"
            selector: ".[auth-logo-text]--mobile"
      - name: "[SUBTITLE_TEXT]"
        keywords: ["[서비스_슬로건]", "부제목", "설명 텍스트"]
        selector: ".[auth-subtitle]"
        type: "text"
        i18n_key: "auth.subtitle"
      - name: "[ID_INPUT]"
        keywords: ["아이디 입력", "이메일 입력", "로그인 아이디"]
        selector: ".[auth-id-input]"
        type: "input"
      - name: "[PASSWORD_INPUT]"
        keywords: ["비밀번호 입력", "패스워드 필드"]
        selector: ".[auth-pw-input]"
        type: "input"
      - name: "[SUBMIT_BUTTON]"
        keywords: ["로그인 버튼", "제출 버튼", "확인 버튼"]
        selector: ".[auth-submit-btn]"
        type: "button"
        style_group: "[PRIMARY_BUTTONS]"
      - name: "[FIND_ID_LINK]"
        keywords: ["아이디 찾기"]
        selector: ".[auth-find-id]"
        type: "link"
      - name: "[FIND_PW_LINK]"
        keywords: ["비밀번호 찾기"]
        selector: ".[auth-find-pw]"
        type: "link"
      - name: "[REGISTER_LINK]"
        keywords: ["신규 회원가입", "회원가입 링크"]
        selector: ".[auth-register-link]"
        type: "link"

  [MAIN_LIST_PAGE]:
    label: "메인 목록 페이지"
    keywords: ["목록", "리스트", "메인 페이지"]
    files:
      - "src/pages/[list].tsx"
      - "src/components/[list]/[ItemList].tsx"
      - "src/components/[list]/[ItemFilter].tsx"
    flows: ["FA_[ITEM_SEARCH_FLOW]", "FA_[ITEM_FILTER_FLOW]"]
    triggers: ["TA_[ITEM_LIST_LOAD]"]
    events: ["EA_[ITEM_SEARCH_EXECUTED]", "EA_[ITEM_FILTER_APPLIED]"]
    db_tables: ["[items_table]", "[categories_table]"]

  [DETAIL_PAGE]:
    label: "상세 페이지"
    keywords: ["상세", "detail", "상세보기"]
    files:
      - "src/pages/[items]/[id].tsx"
      - "src/components/[items]/[ItemDetail].tsx"
    flows: ["FA_[GET_ITEM_DETAIL_FLOW]", "FA_[UPDATE_ITEM_FLOW]"]
    triggers: ["TA_[ITEM_VIEW_COUNT]"]
    events: ["EA_[ITEM_VIEWED]", "EA_[ITEM_UPDATED]"]
    db_tables: ["[items_table]", "[logs_table]"]
```

## 4.2 AI 동작 프로토콜 (전방위 타겟팅)

### 4.2.1 단순 UI 수정 시나리오

**사용자**: "[서비스명] 텍스트를 [새이름]으로 바꿔줘"

**AI 필수 절차**:
1. `docs/project_map.yaml`에서 `"[서비스명]"`, `"로그인"` 등의 키워드로 검색
2. `[AUTH_MODAL] / [BRAND_LOGO_TEXT]` 후보 찾기
3. 아래 메시지로 사용자에게 대상 확인:

```text
📌 색인 맵에서 다음 요소를 찾았습니다:

- 요소명: [BRAND_LOGO_TEXT]
- 위치: src/components/auth/[AuthModal].tsx (.[auth-logo-text])
- 현재 텍스트: "[서비스명]" (i18n: auth.brand.logo)
- 변경 텍스트: "[새이름]"
- 반응형: 데스크톱/모바일 변형 존재

다국어 처리 방법:
1) 한국어만 변경 (i18n 파일 수정)
2) 모든 언어 공통 텍스트로 변경 (컴포넌트 하드코딩)

어떻게 진행할까요? (1/2)
```

### 4.2.2 공유 스타일 파급 범위 제어 시나리오

**사용자**: "[메뉴1명] 글자 크기를 20px로 키워줘"

**AI 절차**:
1. `"[메뉴1명]"` 키워드로 `[MENU_ITEM_1]` 검색
2. `style_group: [NAV_MENU_ITEMS]` 확인
3. 파급 범위 질문:

```text
📌 색인 확인 결과, '[MENU_ITEM_1]'은 '[NAV_MENU_ITEMS]' 스타일 그룹을 공유합니다.

⚠️ 동일한 스타일을 공유하는 메뉴들:
- [메뉴1명] ([MENU_ITEM_1])
- [메뉴2명] ([MENU_ITEM_2])
- [메뉴3명] ([MENU_ITEM_3])
- [메뉴4명] ([MENU_ITEM_4])

글자 크기를 20px로 변경할 때,
1) '[메뉴1명]' 메뉴만 단독으로 20px 적용 (예외 스타일)
2) 상단 네비게이션 메뉴 그룹 전체를 20px로 일괄 변경

어떻게 진행할까요? (1/2)
```

4. 선택에 따라 단일 요소 또는 그룹 전체 스타일 수정

### 4.2.3 색인 누락 시 처리

**사용자**: "[알 수 없는 버튼] 색깔 바꿔줘"

**AI 응답**:
```text
❌ '[알 수 없는 버튼]'에 대한 색인 정보가 없습니다.

이 버튼이 어느 위치에 있는지 더 구체적으로 알려주세요:
1) [AUTH_MODAL] 내부
2) [MAIN_LIST_PAGE] 내부
3) [DETAIL_PAGE] 내부
4) 기타 위치

위치 확인 후 `docs/project_map.yaml`에 색인 엔트리를 먼저 생성하고 수정 작업을 진행하겠습니다.
```

## 4.3 색인 생성/업데이트 강제 규칙

### 4.3.1 색인 업데이트 필수 상황

- 새 페이지/모달/주요 UI 섹션 생성
- 새 주요 UI 요소(버튼, 텍스트, 메뉴, 입력 필드) 생성
- 컴포넌트 파일 경로나 CSS selector 변경
- Flow Atom(FA) 추가 또는 연결 구조 변경
- Trigger Atom(TA), Event Atom(EA) 정의 변경

### 4.3.2 신규 요소 생성 시 3단계 절차

1. **색인 엔트리 초안 작성**
2. **사용자 승인 요청**
3. **승인 후에만 실제 코드 구현**

**예시 확인 메시지**:
```text
📝 새 UI 요소용 색인 엔트리를 작성했습니다:

- 페이지: [AUTH_MODAL]
- 요소명: [NEW_BUTTON]
- 위치: src/components/auth/[AuthModal].tsx (.[new-btn])
- 타입: button
- 설명: [새 버튼 설명]
- 스타일 그룹: [PRIMARY_BUTTONS]
- 반응형: 없음
- 다국어: 없음

이 구성이 맞습니까? (예/수정)
```

### 4.3.3 기존 요소 수정 시 색인 동기화

파일 경로, CSS selector, 컴포넌트명 변경 시 자동 업데이트:
```text
📝 색인 맵을 자동 업데이트했습니다:
- 변경 전: src/components/auth/[OldName].tsx
- 변경 후: src/components/auth/[NewName].tsx
- 영향받은 요소: [BRAND_LOGO_TEXT], [SUBMIT_BUTTON]

docs/project_map.yaml 반영 완료
```

## 4.4 DB 스키마 관리 프로토콜

### 4.4.1 저장 규칙
- **경로**: `docs/db/[테이블명]_schema.md`
- **파일명**: `[테이블명]_schema.md`

### 4.4.2 DB 수정 프로세스 강제
DB 필드 추가/변경 요청 시 **절대 코드를 먼저 작성하지 않음**:
1. **스키마 문서 먼저 업데이트** + Version 증가
2. **사용자 승인 요청**
3. **승인 후 DA, QA, OA 원자 코드 수정**

### 4.4.3 스키마 문서 표준 템플릿

```markdown
# Table: [table_name]
* **Description:** [테이블 설명]
* **Version:** v1.0 (수정 발생 시 반드시 버전업)
* **Last Updated:** YYYY-MM-DD

| 필드명 | 타입 | 제약조건 (PK, FK, Nullable 등) | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 고유 식별자 |
| `[field_name]` | [타입] | [제약조건] | [설명] |
| `created_at` | Timestamp | Not Null | 생성 일시 |
```

## 4.5 프로세스 청사진 프로토콜

### 4.5.1 저장 규칙
- **경로**: `docs/processes/[프로세스명]_process.md`
- **작성 시점**: 새 도메인/큰 기능 개발 시 코드보다 먼저 작성

### 4.5.2 프로세스 청사진 표준 템플릿

```markdown
# Process: [프로세스명]
* **Description:** [프로세스 전체 설명]
* **Version:** v1.0
* **Last Updated:** YYYY-MM-DD

### 1. UI/UX 화면 흐름 (Screen Flow)
[[화면1]] → [[화면2]] → [[화면3]] → [[최종 화면]]

### 2. 프로세스 시퀀스 및 연결된 8-Atoms
- **DA**: [EntityType1], [EntityType2] 타입 정의
- **CA**: [CONFIG_NAME1], [CONFIG_NAME2] 설정
- **TA**: TA_[TRIGGER_NAME1], TA_[TRIGGER_NAME2]
- **FA**: FA_[FLOW_NAME1], FA_[FLOW_NAME2], FA_[FLOW_NAME3]
- **EA**: EA_[EVENT_NAME1], EA_[EVENT_NAME2], EA_[EVENT_NAME3]

### 3. 연관 데이터베이스 (Touched DB Schema)
* `[table1]` 테이블 (조회/생성)
* `[table2]` 테이블 (수정)
* `[table3]` 테이블 (생성)
```

## 4.6 추가 고려 사항

### 4.6.1 반응형 대응 원칙
- 색인 맵의 `responsive_variants`로 뷰포트별 selector 관리
- 수정 요청 시 "데스크톱만/모바일만/전체" 중 어느 뷰포트인지 반드시 확인
- 반응형 변형이 있는 요소는 항상 뷰포트 선택권 제공

### 4.6.2 다국어(i18n) 대응 원칙
- 모든 텍스트 요소에 `i18n_key` 포함 필수
- 텍스트 변경 시 "한국어만 vs 모든 언어 공통" 선택권 반드시 제공
- i18n 파일 경로: `public/locales/[언어코드]/[도메인].json`

### 4.6.3 색인 자동화 도구 연동 (Future)
- 추후 novague에서 컴포넌트 스캔 → 색인 초안 자동 생성 기능 제공 예정
- AI는 항상 **최종 승인된 `docs/project_map.yaml`만 신뢰**
- 자동 생성된 초안도 반드시 사용자 승인 후 확정
- 색인 관리의 부담을 줄이면서도 정확성은 보장하는 하이브리드 접근

### 4.6.4 8-Atom 연결 관계 추적
- 색인 맵에서 `triggers`, `events`, `flows` 필드로 원자 간 관계 명시
- 원자 수정 시 연관된 다른 원자들의 영향도 자동 체크
- 복잡한 의존성 관계도 색인을 통해 시각적으로 파악 가능
