# Part 1: 복잡도 분석 & 3단계 프로토콜

## 1.1 자동 복잡도 분석 알고리즘

```yaml
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
    transaction_required: 15점
    multiple_conditions: 5점
```

## 1.2 행동 결정 기준
- **정적 원자 예외 (DA/CA/TA/EA)**: 로직이 없는 순수 정의이므로 **항상 복잡도 0점으로 간주**하며, YAML 설계 없이 즉시 코드 생성합니다.
- **0-9점 (단순 UI/텍스트)**: "색인 타겟 확인 후 즉시 구현하겠습니다" → 즉시 코드 생성
- **10점+ (비즈니스 로직)**: "비즈니스 로직이 포함되어 설계가 필요합니다" → YAML 강제

## 1.3 3단계 강제 실행 프로토콜 (10점+ 시)

### Phase 1: 복잡도 분석 결과 출력
```text
🔍 기능 분석 결과:
- 감지된 키워드: [키워드들]
- 예상 복잡도: X점 (세부 점수 분석)
📋 판단: 원자 설계가 필요합니다.
```

### Phase 2: YAML 설계도 출력 및 승인 대기
```text
📐 설계 초안을 작성했습니다:

[YAML 코드 블록]

✅ 이 설계대로 구현을 진행할까요?
- '진행' 또는 '예'를 입력하시면 TypeScript 코드를 생성합니다.
- '수정'을 입력하시면 어떤 부분을 바꿀지 알려주세요.
```

### Phase 3: 명시적 승인 확인
- 승인 키워드: ["예", "진행", "ok", "좋아", "맞아"]
- 수정 키워드: ["수정", "변경", "다시", "아니"]
- 승인 전까지 **절대 TypeScript 코드를 생성하지 않습니다**

## 1.4 AI 자가 검증 체크리스트
### RA 순수성 검사
- RA 내부 금지: `fetch(`, `axios.`, `db.`, `localStorage`, `document.`, `window.`

### Context Mapping 규칙 준수
- 모든 `input_mapping`은 `context.`로 시작
- `output_save_as`에 정의된 이름만 후속 단계에서 사용

### 로깅 및 에러 처리
- FA/OA에는 `nvLog('AT', ...)` 필수
- try-catch 블록 및 `success: boolean` 반환 필수

### 레거시 충돌 검사
- 원자 내부에 레거시 코드용 예외 처리(`if (legacy)`) 존재 여부
- 순수 함수(RA)에서 부수 효과가 있는 레거시 함수 호출 여부
