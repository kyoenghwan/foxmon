# 프로젝트 YAML 및 스키마 보일러플레이트 부록

이 파일은 `docs/project_map.yaml` 작성법, 프로세스 청사진(`_process.md`), 그리고 DB 스키마 작성 시 AI가 참고해야 할 전체 YAML 및 Markdown 서식 템플릿입니다. 

---

## 1. 전방위 색인 맵 (`docs/project_map.yaml`) 전체 템플릿

새로운 UI/요소를 `project_map.yaml`에 등록할 때 아래의 구조와 `style_group`, `project_rule` 연결 패턴을 정확히 복사하여 사용하십시오.

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
~~~

---

## 2. DB 스키마 마크다운 템플릿

DB 테이블 생성/수정 전 `docs/db/[테이블명]_schema.md`에 작성해야 하는 템플릿입니다.

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

---

## 3. 거시적 프로세스 청사진 템플릿

신규 도메인/플로우 진입 전 `docs/processes/[이름]_process.md`에 작성해야 하는 템플릿입니다.

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
