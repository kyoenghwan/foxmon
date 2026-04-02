# Part 2: 8-Atom 명세 & 트랜잭션 처리 원칙

## 2.1 원자 분류 개요 (완전한 8-Atom 시스템)

### 정적 원자 (Static Atoms) - 4개
"무엇이 있는가"만 정의, 실행 로직 절대 금지
- 1. DA (Data Atom) - 데이터 정의
- 2. CA (Config Atom) - 설정 정의
- 3. TA (Trigger Atom) - 트리거 정의
- 4. EA (Event Atom) - 이벤트 정의

### 동적 원자 (Dynamic Atoms) - 4개  
"어떻게 동작하는가"를 실제 코드로 구현
- 5. RA (Rule Atom) - 순수 함수
- 6. QA (Query Atom) - 조회
- 7. OA (Operation Atom) - 부수 효과
- 8. FA (Flow Atom) - 조립

---

## 2.2 정적 원자 상세 명세

### 1. DA (Data Atom) - 데이터 정의
- **역할**: 타입, 인터페이스, 스키마, 상수, ENUM 정의
- **절대 금지**: 함수, 계산 로직, I/O 작업 포함

```typescript
// DA_[DOMAIN]_TYPES.ts
export type [EntityName] = {
  id: string;
  email: string;
  createdAt: string;
};

export enum [StatusName] {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### 2. CA (Config Atom) - 설정 정의
- **역할**: 환경변수, 전역 설정값, 서비스별 옵션 정의
- **절대 금지**: 동적 계산, 비즈니스 로직 포함

```typescript
// CA_[DOMAIN]_CONFIG.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_RETRY_COUNT = 3;
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout'
};
```

### 3. TA (Trigger Atom) - 트리거 정의
- **역할**: 시스템 진입점, 스케줄, 웹훅 엔드포인트 정의
- **절대 금지**: 실제 처리 로직 포함 (FA에서 처리)

```typescript
// TA_[DOMAIN]_TRIGGERS.ts
export const [TRIGGER_NAME] = {
  cron: '0 3 * * *',
  flowId: 'FA_[FLOW_NAME]',
  description: '[트리거 설명]'
};
```

### 4. EA (Event Atom) - 이벤트 정의
- **역할**: 시스템 이벤트 타입과 페이로드 구조 정의
- **절대 금지**: 이벤트 처리 로직 포함 (FA/OA에서 처리)

```typescript
// EA_[DOMAIN]_EVENTS.ts
export type [EventName] = {
  type: '[EVENT_TYPE]';
  payload: {
    id: string;
    userId: string;
    occurredAt: string;
  };
};
```

---

## 2.3 동적 원자 상세 명세

### 5. RA (Rule Atom) - 순수 함수
- **순수 함수**: 외부 의존성 절대 금지 (DB, API, localStorage 등)
- **테스트 필수**: Jest/Vitest 단위 테스트 함께 생성
- **Output**: `{ isValid: boolean; score?: number; error?: string; data?: T }`

### 6. QA (Query Atom) - 조회
- **읽기 전용**: 상태 변경 금지, DB 조회/외부 API GET만
- **에러 처리 원칙**:
  - 정상 조회 (데이터 존재): `{ success: true, data: [결과] }`
  - 정상 조회 (데이터 없음): `{ success: true, data: null }`
  - DB 에러/타임아웃: `{ success: false, error: "구체적 에러 메시지" }`
- **Output**: `{ success: boolean; data?: T | T[] | null; error?: string; meta?: any }`

### 7. OA (Operation Atom) - 부수 효과
- **부수 효과**: DB CUD, 외부 API POST/PUT/DELETE, 이메일 발송
- **롤백 데이터**: 트랜잭션 실패 시 복구에 필요한 이전 상태를 `rollbackData`에 반드시 포함
- **Output**: `{ success: boolean; data?: T; error?: string; rollbackData?: any }`

### 8. FA (Flow Atom) - 조립 및 트랜잭션 관리
- **조립 역할**: 다른 원자들을 조합하여 완전한 비즈니스 플로우 구현
- **보안 강제**: Input에 authContext 필수
- **전역 상태 금지**: FA 내부에서 Recoil, Zustand, Redux 등 전역 UI 상태 직접 변경 절대 금지
- **롤백 지원**: 다중 OA 실행 시 Saga 패턴 적용 (아래 2.5 참고)
- **Output**: `{ success: boolean; data?: T; message?: string }`

---

## 2.4 Context Mapping 표준

```yaml
context_mapping_rules:
  initial_input: "context.input.[필드명]"
  step_output: "context.[stepName]Result.[필드명]"

  correct_examples:
    - "context.input.email"
    - "context.userResult.data.userId"
    - "context.validationResult.isValid"

  wrong_examples:
    - "step1.data"        # ❌ context 누락
    - "context.step1"     # ❌ Result 접미사 누락
    - "userResult.data"   # ❌ context. 접두사 누락
```

---

## 2.5 트랜잭션(Transaction) 처리 원칙 ⭐ NEW

FA 안에서 여러 OA가 순차 실행될 때, **하나라도 실패하면 앞서 성공한 OA를 반드시 롤백**해야 합니다.

### 2.5.1 핵심 원칙
- 다중 OA 실행 = 트랜잭션으로 간주
- 각 OA는 `rollbackData`를 반드시 반환
- FA는 실패 시 역순으로 보상 트랜잭션 실행

### 2.5.2 Saga 패턴 구현 표준

```typescript
// FA_[FLOW_NAME].ts
export const [flowName] = async (input: [InputType]) => {
  nvLog('AT', '▶️ FA_[FLOW_NAME] 시작', input);

  // 완료된 OA 스택 (롤백용)
  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // Step 1: 첫 번째 OA 실행
    const step1Result = await OA_[FIRST_OPERATION](input.data1);
    if (!step1Result.success) {
      return { success: false, message: step1Result.error };
    }
    // 롤백 함수 스택에 추가
    completedOAs.push(async () => {
      await OA_[ROLLBACK_FIRST](step1Result.rollbackData);
    });

    // Step 2: 두 번째 OA 실행
    const step2Result = await OA_[SECOND_OPERATION](input.data2);
    if (!step2Result.success) {
      throw new Error(step2Result.error); // 롤백 트리거
    }
    completedOAs.push(async () => {
      await OA_[ROLLBACK_SECOND](step2Result.rollbackData);
    });

    nvLog('AT', '✅ FA_[FLOW_NAME] 성공');
    return { success: true, message: '[성공 메시지]' };

  } catch (error) {
    // 역순 롤백 실행
    nvLog('AT', '⛔ FA_[FLOW_NAME] 실패 - 롤백 시작', error);
    for (const rollback of completedOAs.reverse()) {
      try {
        await rollback();
        nvLog('AT', '🔄 롤백 성공');
      } catch (rollbackError) {
        nvLog('AT', '❌ 롤백 실패', rollbackError);
      }
    }
    return { success: false, message: '처리 중 오류가 발생했습니다.' };
  }
};
```

### 2.5.3 YAML 설계 시 트랜잭션 명시

다중 OA가 포함된 Flow 설계 시 YAML에 반드시 `transaction: true`와 `rollback_atom` 명시:

```yaml
FA_[FLOW_NAME]:
  id: "FA_[FLOW_NAME]"
  type: "flow"
  transaction: true        # 다중 OA = 트랜잭션 명시 필수
  description: "[플로우 설명]"

  input:
    field1: "string"
    field2: "number"

  output:
    success: "boolean"
    message: "string"

  steps:
    - step: 1
      name: "[첫 번째 작업]"
      atom: "OA_[FIRST_OPERATION]"
      input_mapping:
        field1: "context.input.field1"
      output_save_as: "firstResult"
      rollback_atom: "OA_[ROLLBACK_FIRST]"   # 롤백 원자 필수 명시

    - step: 2
      name: "[두 번째 작업]"
      atom: "OA_[SECOND_OPERATION]"
      input_mapping:
        field2: "context.input.field2"
      output_save_as: "secondResult"
      rollback_atom: "OA_[ROLLBACK_SECOND]"  # 롤백 원자 필수 명시
```

---

## 2.6 Flow Atom YAML 기본 템플릿

```yaml
FA_[FLOW_NAME]:
  id: "FA_[FLOW_NAME]"
  type: "flow"
  description: "[플로우 설명]"

  input:
    field1: "string"
    field2: "string"

  output:
    success: "boolean"
    data: "object"
    message: "string"

  steps:
    - step: 1
      name: "[검증 단계]"
      atom: "RA_[VALIDATE_INPUT]"
      input_mapping:
        field1: "context.input.field1"
        field2: "context.input.field2"
      output_save_as: "validationResult"

    - step: 2
      name: "[조회 단계]"
      atom: "QA_[CHECK_EXISTS]"
      input_mapping:
        field1: "context.input.field1"
      output_save_as: "queryResult"

    - step: 3
      name: "[저장 단계]"
      atom: "OA_[SAVE_DATA]"
      input_mapping:
        field1: "context.input.field1"
        processedData: "context.validationResult.data.processedData"
      output_save_as: "saveResult"
```

---

## 2.7 파일 경로 표준
- **YAML 설계도**: `atoms/[domain]/[atom-type]-atoms/`
- **TypeScript 구현**: `src/atoms/[atom-type]/[domain]/`
- **UI 컴포넌트**: `src/components/[domain]/`

## 2.8 색인과 Atom의 관계
- Flow Atom은 색인 맵의 `flows` 필드에 연결
- Flow 관련 수정 시 연관 페이지/컴포넌트 영향도 확인
- 필요시 프로세스 문서(`docs/processes/`) 갱신
