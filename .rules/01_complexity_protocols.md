# Part 1: 복잡도 분석 & 3단계 프로토콜

## 1.1 자동 복잡도 분석 알고리즘

기능 추가 및 수정 요청 시, AI는 아래 기준에 따라 내부적으로 복잡도 점수를 계산합니다.

~~~yaml
complexity_scoring:
  high_complexity_indicators: # 각 10점
    - "저장", "save", "insert", "update", "delete"
    - "조회", "검색", "query", "find"
    - "계산", "calculate", "compute"
    - "검증", "validate", "check"
    - "결제", "payment", "charge"
    - "이메일", "email", "send"
    - "권한", "permission", "auth"
    - "승인", "approve", "confirm"
  
  medium_complexity_indicators: # 각 5점
    - "필터", "filter", "정렬", "sort"
    - "조건", "if", "when", "분기"
    - "페이징", "pagination"
  
  structural_complexity:
    database_access: 15점
    external_api_call: 10점
    authentication_required: 10점
    authorization_required: 10점  # 권한/역할 검증 필요
    transaction_required: 15점
    multiple_conditions: 5점
~~~

## 1.2 행동 결정 기준

- **정적 원자 예외 (DA/CA/TA/EA)**: 로직이 없는 순수 정의이므로 **항상 복잡도 0점**으로 간주하며, YAML 설계 없이 즉시 코드 생성합니다.
- **0-9점 (단순 UI/텍스트)**: "색인 타겟 확인 후 즉시 구현하겠습니다" → 즉시 코드 생성 (단, 프로젝트 특수 지침 우선 적용)
- **10점 이상 (비즈니스 로직)**: "비즈니스 로직이 포함되어 설계가 필요합니다" → YAML 설계 강제

## 1.3 3단계 강제 실행 프로토콜 (10점 이상 시)

### Phase 1: 복잡도 분석 결과 출력
~~~text
🔍 기능 분석 결과:
- 감지된 키워드: [키워드들]
- 구조적 복잡도: [항목들]
- 예상 복잡도: X점 (세부 점수 분석)

📋 판단: 비즈니스 로직이 포함된 고복잡도 기능입니다.
→ YAML 기반 원자 설계가 필요합니다. (즉시 코드 생성 금지)
~~~

### Phase 2: YAML 설계도 출력 및 승인 대기
~~~text
📐 설계 초안을 작성했습니다:

[YAML 설계 내용]

✅ 이 설계대로 구현을 진행할까요?
- '진행' 또는 '예'를 입력하시면 TypeScript 코드를 생성합니다.
- '수정'을 입력하시면 어떤 부분을 바꿀지 알려주세요.

승인 전까지 코드는 생성하지 않습니다.
~~~

### Phase 3: 명시적 승인 확인
- **승인 키워드**: ["예", "진행", "ok", "좋아", "맞아"]
- **수정 키워드**: ["수정", "변경", "다시", "아니"]
- **승인 전까지 절대 TypeScript 코드를 생성하지 않습니다**

## 1.4 AI 자가 검증 체크리스트 (코드 생성 전후 필수 확인)

### RA 순수성 검사
RA 내부에 다음 요소가 존재하면 즉시 중단하고 원자 분리를 수행합니다:

- `fetch(` 또는 `axios.` → QA 또는 OA로 분리 필요
- `db.` 또는 `prisma.` → QA 또는 OA로 분리 필요
- `localStorage` 또는 `sessionStorage` → OA로 분리 필요
- `document.` 또는 `window.` → UI 컴포넌트로 이동 필요
- Recoil/Zustand/Redux 등 전역 상태 라이브러리 → UI 컴포넌트로 이동 필요

### Context Mapping 규칙 준수
- 모든 `input_mapping`은 반드시 `context.`로 시작
- `output_save_as`에 정의된 이름만 후속 단계에서 사용
- **잘못된 예**: `step1.data`, `userResult.data`, `context.step1`
- **올바른 예**: `context.input.email`, `context.userResult.data.userId`, `context.validationResult.isValid`

### 로깅 및 에러 처리
- FA/OA에는 `nvLog('AT', ...)` 호출 필수 포함
- 모든 동적 원자에 try-catch 블록 및 `StandardResult<T>` 반환 구조 필수
- 모든 Flow는 `{ success: boolean; message?: string; data?: any; errorCode?: AtomErrorCode }` 반환 필수

### 보안 컨텍스트 검증 ⭐
- 모든 FA input에 `authContext: { userId, roles, tenantId?, requestId? }` 포함 여부 확인
- Context Mapping에서 authContext 전파: `context.input.authContext.userId`
- 권한 검증은 반드시 RA로 분리: `RA_[DOMAIN]_CAN_[ACTION]` 패턴 준수
- QA/OA 내부에서 직접 권한 체크 금지 (FA가 사전 통과한 상태만 처리)

### 프로젝트 특수 지침 확인 ⭐
- 타겟 요소가 `docs/project_map.yaml`의 `project_rule` 속성을 가지는지 확인
- 해당하는 프로젝트 지침 파일(`docs/project_rules/[rule_name].md`)을 우선 로드했는지 검증
- 프로젝트 지침의 금지 사항을 위반하는 코드가 없는지 최종 확인

### 레거시 충돌 검사
- 원자 내부에 레거시 코드용 예외 처리(`if (isLegacy)`) 존재 여부 확인
- 순수 함수(RA)에서 부수 효과가 있는 레거시 함수 호출 여부 확인
- 발견 즉시 레거시 충돌 방어 프로토콜 실행 (00_master_router.md 참조)

## 1.5 복잡도 점수 계산 예시

### 예시 A: 사용자 로그인 기능
~~~text
감지 키워드:
- "검증" (validate) → +10점
- "조회" (query user) → +10점
- "저장" (save session) → +10점

구조적 복잡도:
- database_access → +15점
- authentication_required → +10점

총점: 55점 → YAML 설계 강제
~~~

### 예시 B: 버튼 텍스트 변경
~~~text
감지 키워드: 없음 → 0점
구조적 복잡도: 없음 → 0점

총점: 0점 → 색인 확인 후 즉시 구현
~~~

### 예시 C: 상품 목록 필터링
~~~text
감지 키워드:
- "필터" (filter) → +5점
- "조회" (query) → +10점
- "조건" (condition) → +5점

구조적 복잡도:
- database_access → +15점
- multiple_conditions → +5점

총점: 40점 → YAML 설계 강제
~~~

### 예시 D: 결제 처리
~~~text
감지 키워드:
- "결제" (payment) → +10점
- "검증" (validate) → +10점
- "저장" (save) → +10점
- "이메일" (email notification) → +10점

구조적 복잡도:
- database_access → +15점
- external_api_call → +10점
- transaction_required → +15점
- authorization_required → +10점

총점: 100점 → 고위험 YAML 설계 강제
~~~

## 1.6 정적 원자 즉시 구현 기준

정적 원자(DA/CA/TA/EA)는 복잡도 점수와 무관하게 **항상 즉시 구현** 가능합니다.
단, 아래 조건을 반드시 충족해야 합니다:

| 원자 타입 | 즉시 구현 조건 | 금지 사항 |
|---|---|---|
| DA | 타입/인터페이스/ENUM 정의만 포함 | 함수, 계산 로직, I/O 작업 |
| CA | 환경변수, 상수값 정의만 포함 | 동적 계산, 비즈니스 로직 |
| TA | 트리거 정의 및 연결 Flow ID만 포함 | 실제 처리 로직 |
| EA | 이벤트 타입과 페이로드 구조 정의만 포함 | 이벤트 처리 로직 |

위 조건을 벗어나는 순간 해당 로직은 동적 원자(RA/QA/OA/FA)로 분리해야 합니다.

## 1.7 원자별 복잡도 기준 가이드

### RA (Rule Atom) - 순수 함수
- 주로 "검증/계산/스코어링" 역할
- 포함 키워드: `검증`, `validate`, `score`, `rule`, `조건`
- 일반적으로 **5~15점** 수준
  - 단일 검증: 5~10점
  - 복합 룰/스코어링: 10~20점

### QA (Query Atom) - 조회 전용
- 모든 DB 조회, 외부 API GET 작업
- `database_access` 또는 `external_api_call`로 인해 **최소 10~25점**
- 단일 테이블 조회도 기존 QA 재사용 우선 검토

### OA (Operation Atom) - 부수 효과
- DB CUD, 외부 API POST/PUT/DELETE, 이메일 발송 등
- 항상 **롤백 고려** 필요로 복잡도 15점 이상
- `rollbackData` 반환 및 `rollback_atom` 설계 필수

### FA (Flow Atom) - 비즈니스 프로세스
- QA/OA/RA 조합으로 완전한 유스케이스 구현
- QA/OA 1개 + 가벼운 RA → 10~20점
- 다중 OA + 트랜잭션 + 권한 검증 → 30점 이상

## 1.8 YAML 설계 강제 방어 프로토콜

### YAML 생략 요청 방어
~~~text
❌ 불가능합니다.

이 기능의 복잡도 점수는 [X]점으로, Functional Atomic Design 원칙에 따라
반드시 YAML 설계 승인이 선행되어야 합니다.

설계 없이 구현하면:
- 나중에 수정이 어려워집니다
- 다른 기능과 충돌할 수 있습니다
- 버그 발생 시 원인 파악이 불가능합니다

설계를 먼저 진행하겠습니다.
~~~

### 즉시 코드 요청 방어
~~~text
❌ 승인되지 않은 설계를 기반으로 코드를 생성할 수 없습니다.

현재 단계: Phase 2 (설계 검토 중)
다음 단계: '진행' 또는 '예' 입력 시 Phase 3 (코드 생성) 진행

설계 내용을 검토 후 승인해 주세요.
~~~

### "빠르게 만들어줘" 요청 방어
~~~text
❌ 단기 속도보다 장기 안정성이 우선입니다.

이 프로젝트는 8-Atom 체계와 색인 기반 아키텍처를 사용하고 있습니다.
이를 무시한 빠른 구현은:
- 레거시 코드가 되어 나중에 반드시 재작업이 필요하고
- 기존 원자 구조와 충돌할 위험이 큽니다.

YAML 설계를 통한 원자 기반 구현으로만 진행하겠습니다.
~~~

## 1.9 트랜잭션 처리 및 YAML 명시 규칙

### 다중 OA = 트랜잭션 강제
FA 내부에서 OA가 2개 이상 연속 실행된다면, 해당 Flow는 **트랜잭션**으로 간주합니다.

YAML 설계에서 반드시:
~~~yaml
FA_[FLOW_NAME]:
  transaction: true
  steps:
    - step: 1
      atom: "OA_[FIRST]"
      rollback_atom: "OA_[ROLLBACK_FIRST]"
    - step: 2
      atom: "OA_[SECOND]"
      rollback_atom: "OA_[ROLLBACK_SECOND]"
~~~

### Saga 패턴 적용 필수
- **완료된 OA 스택**을 쌓고, 실패 시 역순 롤백
- 최종 반환은 항상 `StandardResult<T>` 타입
- 자세한 구현 방법은 `02_atom_specifications.md` 참조

## 1.10 정리

- **복잡도 0–9점**: 색인/프로젝트 지침 확인 후 곧바로 구현 가능 (정적 원자 포함)
- **복잡도 10점 이상**: 반드시 **YAML 설계 → 승인 → 구현** 순으로 진행
- **보안, 트랜잭션, 다중 OA, 외부 연동**이 얽힌 기능은 거의 항상 10점 이상이므로 **설계 생략 불가**
- **프로젝트 특수 지침**이 있는 요소는 해당 지침을 범용 지침보다 우선 적용

이 문서는 **"무조건 설계부터"**라는 합의를 기계적으로 실행하기 위한 AI용 프로토콜입니다.
구체적인 원자 타입/반환 타입/트랜잭션 구현 상세는 `02_atom_specifications.md`에서 정의합니다.
