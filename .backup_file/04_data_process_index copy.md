# Part 4: 전방위 UI 색인 맵 & 파급 범위 제어 프로토콜

## 4.1 전방위 AI용 프로젝트 색인 맵 (핵심 기능)

모든 UI 요소, 페이지, 원자(8-Atom)의 위치와 관계를 단일 파일(`docs/project_map.yaml`)에서 관리하는 **SSOT(Single Source of Truth)** 시스템입니다. AI는 어떤 작업을 수행하기 전에 반드시 이 파일을 먼저 조회해야 하며, 색인에 없는 요소는 코드 작업 전 반드시 등록 절차를 거쳐야 합니다.

### 4.1.1 색인 맵 파일 구조 (`docs/project_map.yaml`)

~~~yaml
# =============================================
# 1. 전역 공통 컴포넌트 (공유 스타일 그룹)
# =============================================
global_components:
  [TOP_NAVIGATION]:
    label: "상단 네비게이션 바"
    keywords: ["상단 메뉴", "네비게이션", "메뉴바"]
    shared_style: true
    style_group: "[NAV_MENU_ITEMS]"
    project_rule: null                           # 프로젝트 특수 지침 (없으면 null)
    files: ["src/components/layout/[TopNav].tsx"]
    triggers: ["TA_[NAV_ROUTE_CHANGE]"]          # 연결된 Trigger Atom
    events: ["EA_[PAGE_NAVIGATED]"]              # 연결된 Event Atom
    elements:
      - name: "[MENU_ITEM_HOME]"
        keywords: ["홈", "home", "첫화면"]
        selector: ".nav-item.home"
        type: "nav-item"
        style_group: "[NAV_MENU_ITEMS]"
      - name: "[MENU_ITEM_1]"
        keywords: ["[메뉴1명]", "[메뉴1_영문]", "[메뉴1_설명]"]
        selector: ".nav-item.[menu1]"
        type: "nav-item"
        style_group: "[NAV_MENU_ITEMS]"

# =============================================
# 2. 페이지별 세부 UI 요소 및 8-Atom 연결
# =============================================
pages:
  [AUTH_MODAL]:
    label: "인증 모달 (로그인/회원가입)"
    keywords: ["로그인", "로그인창", "회원로그인", "auth"]
    files: ["src/components/auth/[AuthModal].tsx"]
    flows: ["FA_[AUTH_LOGIN_FLOW]", "FA_[AUTH_REGISTER_FLOW]"]
    triggers: ["TA_[AUTH_SESSION_CLEANUP]"]
    events: ["EA_[LOGIN_SUCCESS]", "EA_[LOGIN_FAILED]", "EA_[USER_REGISTERED]"]
    db_tables: ["[users_table]", "[sessions_table]"]
    project_rule: null
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
      - name: "[SUBMIT_BUTTON]"
        keywords: ["로그인 버튼", "제출 버튼", "확인 버튼"]
        selector: ".[auth-submit-btn]"
        type: "button"
        style_group: "[PRIMARY_BUTTONS]"

  [BANNER_SECTION]:
    label: "메인 배너 섹션"
    keywords: ["배너", "banner", "광고", "슬라이드", "메인 배너"]
    files:
      - "src/components/banner/[BannerGroup].tsx"
      - "src/components/banner/[BannerItem].tsx"
    flows: ["FA_BANNER_SYNC_RESPONSIVE", "FA_BANNER_GET_ACTIVE_GROUP"]
    triggers: ["TA_BANNER_REFRESH"]
    events: ["EA_BANNER_CLICKED", "EA_BANNER_UPDATED"]
    db_tables: ["[banners_table]", "[banner_groups_table]"]
    project_rule: "banner_responsive_sync"       # 🔴 프로젝트 특수 지침 연결
    ui_elements:
      - name: "[MAIN_TOP_BANNER]"
        keywords: ["메인 배너", "상단 배너"]
        selector: ".banner-main-top"
        type: "image"
        style_group: "[BANNER_GROUP]"
        responsive_variants:
          - viewport: "desktop"
            selector: ".banner-main-top--desktop"
          - viewport: "tablet"
            selector: ".banner-main-top--tablet"
          - viewport: "mobile"
            selector: ".banner-main-top--mobile"

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
    project_rule: null
~~~

---

## 4.2 AI 동작 프로토콜 (전방위 타겟팅)

### 4.2.1 단순 UI 수정 시나리오

**사용자**: "[서비스명] 텍스트를 [새이름]으로 바꿔줘"

**AI 필수 절차:**

1. `docs/project_map.yaml`에서 `"[서비스명]"`, `"로고"` 등의 키워드로 검색
2. `[AUTH_MODAL] / [BRAND_LOGO_TEXT]` 후보 찾기
3. `project_rule` 속성 확인 → 없으면 범용 지침 적용
4. 아래 메시지로 사용자에게 대상 확인:

~~~text
📌 색인 맵에서 다음 요소를 찾았습니다:

- 요소명: [BRAND_LOGO_TEXT]
- 위치: src/components/auth/[AuthModal].tsx (.[auth-logo-text])
- 현재 텍스트: "[서비스명]" (i18n: auth.brand.logo)
- 변경 텍스트: "[새이름]"
- 반응형: 데스크톱/모바일 변형 존재
- 프로젝트 특수 지침: 없음

다국어 처리 방법:
1) 한국어만 변경 (i18n 파일 수정)
2) 모든 언어 공통 텍스트로 변경 (컴포넌트 하드코딩)

어떻게 진행할까요? (1/2)
~~~

### 4.2.2 공유 스타일 파급 범위 제어 시나리오

**사용자**: "[메뉴1명] 글자 크기를 20px로 키워줘"

**AI 절차:**
1. `"[메뉴1명]"` 키워드로 `[MENU_ITEM_1]` 검색
2. `style_group: [NAV_MENU_ITEMS]` 확인
3. 파급 범위 질문:

~~~text
📌 색인 확인 결과, '[MENU_ITEM_1]'은 '[NAV_MENU_ITEMS]' 스타일 그룹을 공유합니다.

⚠️ 동일한 스타일을 공유하는 메뉴들:
- [메뉴1명] ([MENU_ITEM_1])
- 홈 ([MENU_ITEM_HOME])
- ... (기타 메뉴들)

글자 크기를 20px로 변경할 때,
1) '[메뉴1명]' 메뉴만 단독으로 20px 적용 (예외 스타일)
2) 상단 네비게이션 메뉴 그룹 전체를 20px로 일괄 변경

어떻게 진행할까요? (1/2)
~~~

### 4.2.3 프로젝트 특수 지침 감지 시나리오

**사용자**: "배너 크기 좀 바꿔줘"

**AI 절차:**
1. `"배너"` 키워드로 `[BANNER_SECTION]` 검색
2. `project_rule: "banner_responsive_sync"` 감지
3. `docs/project_rules/banner_responsive_sync.md` 즉시 로드
4. 해당 지침의 필수 질문 프로토콜 실행:

~~~text
⚠️ [프로젝트 특수 지침 적용: banner_responsive_sync]

이 프로젝트의 배너는 반응형 동기화 시스템으로 관리됩니다.
모든 배너는 개별 크기 조절이 금지되며, 그룹 단위로만 제어됩니다.

배너 수정 범위를 선택해주세요:
1) 내용만 수정 (텍스트/이미지/링크 - 레이아웃 유지)
2) 배너 그룹 전체 스케일 시스템 수정 (고위험 - YAML 설계 필요)
3) 특정 뷰포트만 수정 (데스크톱/태블릿/모바일 중 선택)

선택: (1/2/3)
~~~

### 4.2.4 색인 누락 시 처리

**사용자**: "[알 수 없는 버튼] 색깔 바꿔줘"

**AI 응답:**
~~~text
❌ '[알 수 없는 버튼]'에 대한 색인 정보가 없습니다.

이 버튼이 어느 위치에 있는지 더 구체적으로 알려주세요:
1) [AUTH_MODAL] 내부
2) [BANNER_SECTION] 내부
3) [MAIN_LIST_PAGE] 내부
4) 기타 위치 (구체적인 설명 필요)

위치 확인 후 `docs/project_map.yaml`에 색인 엔트리를 먼저 생성하고
수정 작업을 진행하겠습니다.
~~~

---

## 4.3 색인 생성/업데이트 강제 규칙

### 4.3.1 색인 업데이트 필수 상황

다음 상황에서는 **반드시 색인 맵을 먼저 업데이트**하고 사용자 승인을 받은 후 코드를 수정/추가합니다:

- 새 페이지/모달/주요 UI 섹션 생성
- 새 주요 UI 요소(버튼, 텍스트, 메뉴, 입력 필드) 생성
- 컴포넌트 파일 경로나 CSS selector 변경
- **Flow Atom(FA) 추가 또는 연결 구조 변경**
- **Trigger Atom(TA), Event Atom(EA) 정의 변경**
- 공유 스타일 그룹(`style_group`) 또는 프로젝트 지침(`project_rule`) 구조 변경

### 4.3.2 신규 요소 생성 시 3단계 절차

**Step 1. 색인 엔트리 초안 작성**
**Step 2. 사용자 승인 요청**
**Step 3. 승인 후에만 실제 코드 구현**

**예시 확인 메시지:**
~~~text
📝 새 UI 요소용 색인 엔트리를 작성했습니다:

- 페이지: [AUTH_MODAL]
- 요소명: [NEW_BUTTON]
- 위치: src/components/auth/[AuthModal].tsx (.[new-btn])
- 타입: button
- 설명: [새 버튼 설명]
- 스타일 그룹: [PRIMARY_BUTTONS]
- 반응형: 없음
- 다국어: 없음
- 프로젝트 특수 지침: 없음

이 구성이 맞습니까? (예/수정)
~~~

### 4.3.3 기존 요소 수정 시 색인 동기화

파일 경로, CSS selector, 컴포넌트명 변경 시 색인 맵 자동 업데이트:

~~~text
📝 색인 맵을 자동 업데이트했습니다:
- 변경 전: src/components/auth/[OldName].tsx
- 변경 후: src/components/auth/[NewName].tsx
- 영향받은 요소: [BRAND_LOGO_TEXT], [SUBMIT_BUTTON]

docs/project_map.yaml 반영 완료
~~~

---

## 4.4 DB 스키마 관리 프로토콜

### 4.4.1 저장 규칙
- **경로**: `docs/db/[테이블명]_schema.md`
- **파일명**: `[테이블명]_schema.md`
- **원칙**: DB 필드명은 반드시 이 문서를 기준으로 하며, 임의 추측 절대 금지

### 4.4.2 DB 수정 프로세스 강제

DB 필드 추가/변경 요청 시 **절대 코드를 먼저 작성하지 않습니다:**

~~~text
🗄️ DB 스키마 변경이 감지되었습니다.

변경 대상: [테이블명]
변경 내용: [필드 추가/수정/삭제 내용]

진행 순서:
1. docs/db/[테이블명]_schema.md 문서 업데이트 (Version 증가)
2. 사용자 승인 요청
3. 승인 후 DA, QA, OA 원자 코드 수정

스키마 문서 초안을 먼저 작성하겠습니다.
~~~

### 4.4.3 스키마 문서 표준 템플릿

~~~markdown
# Table: [table_name]

- **Description:** [테이블 설명]
- **Version:** v1.0 (수정 발생 시 반드시 버전업)
- **Last Updated:** YYYY-MM-DD

| 필드명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | UUID | PK, Not Null | 고유 식별자 |
| `[field_name]` | [타입] | [제약조건] | [설명] |
| `created_at` | Timestamp | Not Null | 생성 일시 |
| `updated_at` | Timestamp | Not Null | 수정 일시 |
| `created_by` | UUID | FK(users.id), Not Null | 생성자 ID |
| `tenant_id` | UUID | FK(tenants.id), Nullable | 멀티테넌트 식별자 |

## 인덱스 정보
| 인덱스명 | 대상 필드 | 타입 | 설명 |
|---|---|---|---|
| `idx_[table]_[field]` | `[field_name]` | BTREE | [인덱스 설명] |

## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | YYYY-MM-DD | 초기 생성 |
~~~

### 4.4.4 DB 스키마 SSOT 원칙 위반 방어

~~~text
❌ 불가능합니다. (Schema as SSOT 원칙 위반)

docs/db/[테이블명]_schema.md 문서를 먼저 확인하지 않고
임의로 필드명을 사용하거나 추측하는 것은 금지됩니다.

올바른 절차:
1. docs/db/[테이블명]_schema.md 조회
2. 존재하는 필드명만 사용
3. 새 필드가 필요하면 스키마 문서 업데이트 후 승인

스키마 문서를 먼저 확인하겠습니다.
~~~

---

## 4.5 프로세스 청사진 프로토콜

### 4.5.1 저장 규칙
- **경로**: `docs/processes/[프로세스명]_process.md`
- **작성 시점**: 새 도메인/큰 기능 개발 시 코드보다 먼저 작성

### 4.5.2 프로세스 청사진 표준 템플릿

~~~markdown
# Process: [프로세스명]

- **Description:** [프로세스 전체 설명]
- **Version:** v1.0
- **Last Updated:** YYYY-MM-DD

## 1. UI/UX 화면 흐름 (Screen Flow)

[[화면1]] → [[화면2]] → [[화면3]] → [[최종 화면]]

## 2. 프로세스 시퀀스 및 연결된 8-Atoms

- **DA**: [EntityType1], [EntityType2], AtomErrorCode 타입 정의
- **CA**: [CONFIG_NAME1], [CONFIG_NAME2] 설정
- **TA**: TA_[TRIGGER_NAME1], TA_[TRIGGER_NAME2]
- **EA**: EA_[EVENT_NAME1], EA_[EVENT_NAME2]
- **RA**: RA_[DOMAIN]_CAN_[ACTION] (권한 검증), RA_[VALIDATE_INPUT] (입력 검증)
- **QA**: QA_[QUERY_NAME1], QA_[QUERY_NAME2]
- **OA**: OA_[OPERATION_NAME1], OA_[OPERATION_NAME2]
- **FA**: FA_[FLOW_NAME1], FA_[FLOW_NAME2]

## 3. 연관 데이터베이스 (Touched DB Schema)

- `[table1]` 테이블 (조회/생성)
- `[table2]` 테이블 (수정)
- `[table3]` 테이블 (생성)

## 4. 트랜잭션 구간

- **트랜잭션 시작**: [시작 지점]
- **트랜잭션 종료**: [종료 지점]
- **롤백 조건**: [롤백이 필요한 상황]
- **롤백 원자**: [OA_ROLLBACK_XXX 목록]

## 5. 보안 요구사항

- **인증 필요**: [예/아니오]
- **권한 레벨**: [필요한 역할/권한]
- **데이터 접근 범위**: [접근 가능한 데이터 범위]

## 6. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | YYYY-MM-DD | 초기 작성 |
~~~

---

## 4.6 프로젝트 특수 지침 시스템

### 4.6.1 프로젝트 특수 지침 파일 구조

~~~text
docs/
├── guidelines/                        ← 범용 지침 (모든 프로젝트 공통)
│   ├── 00_master_router.md
│   ├── 01_complexity_protocols.md
│   ├── 02_atom_specifications.md
│   ├── 03_integration_logging.md
│   └── 04_data_process_index.md       ← 현재 파일
│
├── project_rules/                     ← 프로젝트별 특수 지침
│   ├── 00_project_overview.md         ← 프로젝트 개요 & 특수 규칙 목록
│   └── [domain]_rules.md              ← 도메인별 특수 지침
│
├── db/                                ← DB 스키마 문서
│   └── [table_name]_schema.md
│
├── processes/                         ← 프로세스 청사진
│   └── [process_name]_process.md
│
└── project_map.yaml                   ← 전방위 색인 맵 (핵심)
~~~

### 4.6.2 프로젝트 개요 파일 표준 템플릿

**파일: `docs/project_rules/00_project_overview.md`**

~~~markdown
# [프로젝트명] - 프로젝트 특수 지침 개요

## 프로젝트 기본 정보

- **프로젝트명**: [구체적인 프로젝트명]
- **도메인**: [서비스 도메인 설명]
- **생성일**: YYYY-MM-DD
- **버전**: v1.0

## ⚠️ AI 필수 확인 규칙

아래 도메인 작업 시 반드시 해당 특수 지침을 먼저 읽어라:

| 도메인 | 트리거 키워드 | 특수 지침 파일 | 위험도 |
|---|---|---|---|
| 배너 | "배너", "banner", "광고", "슬라이드" | `banner_responsive_sync.md` | 🔴 HIGH |
| 검색 | "검색", "필터", "search", "키워드" | `search_filter_rules.md` | 🟡 MEDIUM |
| 결제 | "결제", "payment", "구매", "환불" | `payment_flow_rules.md` | 🔴 HIGH |

## 프로젝트 전역 제약 사항

- 모든 배너는 반응형 동기화 시스템을 통해서만 크기 조절 가능
- 검색 필터는 URL 쿼리 파라미터와 완전 동기화 유지 필수
- 결제 관련 모든 OA는 멱등성 키 필수 포함

## 범용 지침과의 관계

- **절대 불변**: 8-Atom 체계, 8대 절대 원칙
- **우선 적용**: 프로젝트 특수 지침이 범용 지침보다 우선
- **충돌 해결**: 원자 순수성을 훼손하지 않는 선에서 프로젝트 지침 우선

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | YYYY-MM-DD | 초기 작성 |
~~~

### 4.6.3 도메인별 특수 지침 표준 템플릿

**파일: `docs/project_rules/[domain]_rules.md`**

~~~markdown
# 프로젝트 특수 지침: [도메인명] 규칙

## 📌 이 지침을 읽어야 하는 상황

AI는 다음 키워드 감지 시 이 파일을 **반드시 먼저** 읽는다:
**"[키워드1]", "[키워드2]", "[키워드3]"**

---

## 1. 핵심 원칙 (절대 준수)

> **"[이 도메인의 핵심 불변 원칙을 한 문장으로 기술]"**

### 1.1 [원칙 1 제목]
[원칙 1 상세 설명]

### 1.2 [원칙 2 제목]
[원칙 2 상세 설명]

---

## 2. AI 필수 질문 프로토콜

[도메인] 관련 작업 요청 시 반드시 아래 질문을 먼저 수행한다:

~~~text
⚠️ [프로젝트 특수 지침 적용: [domain]_rules]

[상황 설명]

[선택 옵션]:
1) [옵션 1 설명]
2) [옵션 2 설명]
3) [옵션 3 설명]

선택: (1/2/3)
~~~

**옵션별 처리 방식:**
- **옵션 1**: [처리 방식 설명]
- **옵션 2**: [처리 방식 설명]
- **옵션 3**: [처리 방식 설명]

---

## 3. 금지 사항 (Never Do)

~~~text
❌ 절대 금지 목록:
- [금지 사항 1]
- [금지 사항 2]
- [금지 사항 3]
~~~

---

## 4. 연결된 원자 목록

| 원자 타입 | ID | 역할 |
|---|---|---|
| DA | `DA_[DOMAIN]_TYPES` | [설명] |
| CA | `CA_[DOMAIN]_CONFIG` | [설명] |
| QA | `QA_[DOMAIN]_[QUERY]` | [설명] |
| OA | `OA_[DOMAIN]_[OPERATION]` | [설명] |
| FA | `FA_[DOMAIN]_[FLOW]` | [설명] |

---

## 5. 지침 버전 관리

- **버전**: v1.0
- **생성일**: YYYY-MM-DD
- **최종 수정**: YYYY-MM-DD

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | YYYY-MM-DD | 초기 작성 |
~~~

### 4.6.4 새 프로젝트 시작 시 AI 진행 순서

~~~text
🚀 새 프로젝트 시작 시 AI 필수 진행 순서:

Step 1. 프로젝트 도메인 및 특수성 분석
         - 서비스 성격, 주요 도메인, 고위험 영역 파악

Step 2. docs/project_rules/00_project_overview.md 작성 및 승인
         - 프로젝트 전역 제약 사항 정의
         - 도메인별 위험도 분류

Step 3. 고위험 도메인별 특수 지침 파일 순차 작성
         - 🔴 HIGH 위험도 도메인 우선 작성
         - AI 필수 질문 프로토콜 포함

Step 4. docs/project_map.yaml 초기 구조 생성
         - 주요 페이지/컴포넌트 색인 등록
         - project_rule 속성 연결

Step 5. 첫 작업부터 프로젝트 지침 우선 적용 시작
~~~

### 4.6.5 AI 프로젝트 지침 자동 감지 및 제안

AI가 다음 상황을 감지하면 자동으로 프로젝트 특수 지침 생성을 제안합니다:

1. 여러 컴포넌트가 동일한 반응형/상태 변화 규칙을 공유해야 할 때
2. 사용자가 "이 요소들은 항상 같이 움직여야 해" 류의 도메인 제약을 언급할 때
3. 특정 도메인에서 범용 원칙 이상의 엄격한 규칙이 반복적으로 필요할 때

~~~text
⚠️ [프로젝트 특수 지침 생성 제안]

해당 요구사항은 이 프로젝트 전반에 일관되게 적용되어야 하는 특수 규칙입니다.
코드 파편화 방지를 위해 프로젝트 특수 지침 문서화를 제안합니다.

📝 제안 지침명: docs/project_rules/[domain]_rules.md
📋 핵심 규칙: [감지된 핵심 제약 사항 요약]
⚠️ 위험도: [🔴 HIGH / 🟡 MEDIUM / 🟢 LOW]

이 특수 지침을 먼저 생성하고 색인 맵에 연결할까요? (예/아니오)
~~~

---

## 4.7 추가 고려 사항

### 4.7.1 반응형 대응 원칙
- 색인 맵의 `responsive_variants`로 뷰포트별 selector 관리
- 수정 요청 시 "데스크톱만/모바일만/전체" 중 어느 뷰포트인지 반드시 확인
- 반응형 변형이 있는 요소는 항상 뷰포트 선택권 제공
- **프로젝트 특수 지침에 반응형 규칙이 있는 경우 해당 지침 우선 적용**

### 4.7.2 다국어(i18n) 대응 원칙
- 모든 텍스트 요소에 `i18n_key` 포함 필수
- 텍스트 변경 시 "한국어만 vs 모든 언어 공통" 선택권 반드시 제공
- i18n 파일 경로: `public/locales/[언어코드]/[도메인].json`

### 4.7.3 색인 자동화 도구 연동 (Future)
- 추후 novague에서 컴포넌트 스캔 → 색인 초안 자동 생성 기능 제공 예정
- AI는 항상 **최종 승인된 `docs/project_map.yaml`만 신뢰**
- 자동 생성된 초안도 반드시 사용자 승인 후 확정
- 색인 관리의 부담을 줄이면서도 정확성은 보장하는 하이브리드 접근

### 4.7.4 8-Atom 연결 관계 추적
- 색인 맵에서 `triggers`, `events`, `flows` 필드로 원자 간 관계 명시
- 원자 수정 시 연관된 다른 원자들의 영향도 자동 체크
- 복잡한 의존성 관계도 색인을 통해 시각적으로 파악 가능
- StandardResult<T> 및 AtomErrorCode 표준 준수 여부 추적

---

## 4.8 요약

- **`docs/project_map.yaml`은 모든 작업의 출발점**이며, 색인에 없는 요소는 코드 작업 전 반드시 등록한다.
- **`docs/db/[table]_schema.md`는 DB 필드명의 유일한 진실의 원천(SSOT)**이며, 임의 추측은 절대 금지한다.
- **`docs/project_rules/`의 특수 지침은 범용 지침보다 우선 적용**되며, 8-Atom 체계는 어떤 경우에도 훼손되지 않는다.
- **`docs/processes/`의 프로세스 청사진은 코드보다 먼저 작성**되며, 비즈니스 흐름의 전체 그림을 제공한다.
- 새 프로젝트 시작 시 반드시 **프로젝트 개요 → 특수 지침 → 색인 맵 → 코드** 순으로 진행한다.
- 모든 문서는 버전 관리되며, 변경 시 반드시 사용자 승인을 거친다.
