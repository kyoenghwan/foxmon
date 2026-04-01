# Part 2: 8-Atom 명세 & YAML 템플릿

## 2.1 원자별 핵심 규칙

### RA (Rule Atom)
- **순수 함수**: 외부 의존성 절대 금지
- **테스트 필수**: Jest/Vitest 단위 테스트 함께 생성
- **Output**: `{ isValid: boolean; score?: number; error?: string; data?: T }`

### QA (Query Atom)
- **읽기 전용**: 상태 변경 금지
- **Output**: `T | null` 또는 `T[]`

### OA (Operation Atom)
- **부수 효과**: DB CUD, API 연동
- **Output**: `{ success: boolean; data?: T; error?: string; rollbackData?: any }`

### FA (Flow Atom)
- **조립 역할**: 다른 원자들을 조합
- **보안 강제**: Input에 authContext 필수
- **롤백 지원**: 다중 OA 실행 시 Saga 패턴 적용
- **Output**: `{ success: boolean; data?: T; message?: string }`

## 2.2 Context Mapping 표준

```yaml
context_mapping_rules:
  initial_input: "context.input.[필드명]"
  step_output: "context.[stepName]Result.[필드명]"
  
  correct_examples:
    - "context.input.email"
    - "context.userResult.data.userId"
    - "context.validationResult.isValid"
  
  wrong_examples:
    - "step1.data"           # ❌ context 누락
    - "context.step1"        # ❌ Result 접미사 누락
    - "userResult.data"      # ❌ context. 접두사 누락
```

## 2.3 Flow Atom YAML 표준 템플릿

```yaml
FA_USER_REGISTRATION:
  id: "FA_USER_REGISTRATION"
  type: "flow"
  description: "사용자 회원가입 전체 플로우"
  
  input:
    email: "string"
    password: "string"
    name: "string"
  
  output:
    success: "boolean"
    userId: "string"
    message: "string"
  
  steps:
    - step: 1
      name: "입력 검증"
      atom: "RA_VALIDATE_USER_INPUT"
      input_mapping:
        email: "context.input.email"
        password: "context.input.password"
      output_save_as: "validationResult"
      
    - step: 2
      name: "중복 확인"
      atom: "QA_CHECK_USER_EXISTS"
      input_mapping:
        email: "context.input.email"
      output_save_as: "existsCheck"
      
    - step: 3
      name: "사용자 저장"
      atom: "OA_SAVE_USER_TO_DB"
      input_mapping:
        email: "context.input.email"
        hashedPassword: "context.validationResult.data.hashedPassword"
        name: "context.input.name"
      output_save_as: "saveResult"
```

## 2.4 파일 경로 표준
- **YAML 설계도**: `atoms/[domain]/[atom-type]-atoms/`
- **TypeScript 구현**: `src/atoms/[atom-type]/[domain]/`
- **UI 컴포넌트**: `src/components/[domain]/`

## 2.5 색인과 Atom의 관계
- Flow Atom은 색인 맵의 `flows` 필드에 연결
- Flow 관련 수정 시 연관 페이지/컴포넌트 영향도 확인
- 필요시 프로세스 문서(`docs/processes/`) 갱신
