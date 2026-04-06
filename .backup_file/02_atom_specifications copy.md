# Part 2: 8-Atom 명세 & 트랜잭션 처리 원칙

## 2.1 원자 분류 개요 (완전한 8-Atom 시스템)

8-Atom 체계는 모든 코드를 역할에 따라 8가지 원자 단위로 분류하여 관리합니다. 각 원자는 단 하나의 책임만 가지며, 이를 벗어나는 코드는 즉시 분리해야 합니다.

### 정적 원자 (Static Atoms) - 4개
"무엇이 있는가"만 정의하며, 실행 로직은 절대 포함하지 않습니다.

- **1. DA (Data Atom)** - 데이터 타입, 인터페이스, ENUM, 에러 코드 정의
- **2. CA (Config Atom)** - 환경변수, 전역 설정값, 상수 정의  
- **3. TA (Trigger Atom)** - 시스템 진입점, 스케줄, 웹훅 정의
- **4. EA (Event Atom)** - 시스템 이벤트 타입과 페이로드 구조 정의

### 동적 원자 (Dynamic Atoms) - 4개  
"어떻게 동작하는가"를 실제 코드로 구현합니다.

- **5. RA (Rule Atom)** - 순수 함수, 외부 의존성 절대 금지
- **6. QA (Query Atom)** - 읽기 전용 조회, DB/외부 API GET
- **7. OA (Operation Atom)** - 부수 효과, DB CUD/외부 API POST·PUT·DELETE  
- **8. FA (Flow Atom)** - 원자 조립, 완전한 비즈니스 플로우 구현

---

## 2.2 공통 에러 코드 표준 (Error Code SSOT) ⭐

모든 동적 원자의 반환값은 표준화된 에러 코드 체계를 공유합니다. 에러 코드는 DA로 정의하여 단일 진실의 원천(SSOT)을 유지합니다.

### 2.2.1 DA_COMMON_ERROR_TYPES 정의

~~~typescript
// src/atoms/da/common/DA_COMMON_ERROR_TYPES.ts
export type AtomErrorCode =
  | 'VALIDATION_FAILED'       // 입력값 검증 실패
  | 'NOT_FOUND'               // 리소스 없음
  | 'PERMISSION_DENIED'       // 권한 부족
  | 'CONFLICT'                // 데이터 충돌 (중복, 버전 충돌)
  | 'RATE_LIMITED'            // 요청 제한 초과
  | 'EXTERNAL_SERVICE_ERROR'  // 외부 API 오류
  | 'INTERNAL_ERROR';         // 시스템 내부 오류

export type StandardResult<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: AtomErrorCode;
  errorDetail?: string;   // 개발자용 상세 정보 (운영 환경 노출 금지)
  rollbackData?: any;     // OA 전용: 트랜잭션 롤백에 필요한 이전 상태
};
~~~

### 2.2.2 원자별 StandardResult 적용 기준

| 원자 타입 | 반환 타입 | rollbackData 포함 여부 |
|---|---|---|
| RA | `StandardResult<T>` | 불필요 |
| QA | `StandardResult<T 또는 T[] 또는 null>` | 불필요 |
| OA | `StandardResult<T>` | **필수** |
| FA | `StandardResult<T>` | 불필요 (내부에서 처리) |

---

## 2.3 정적 원자 상세 명세

### DA (Data Atom) - 데이터 정의

**역할**: 타입, 인터페이스, 스키마, 상수, ENUM 정의  
**절대 금지**: 함수, 계산 로직, I/O 작업 포함

~~~typescript
// src/atoms/da/[domain]/DA_[DOMAIN]_TYPES.ts
export type [EntityName] = {
  id: string;
  email: string;
  name: string;
  status: [StatusName];
  createdAt: string;
};

export enum [StatusName] {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export type [RequestName] = {
  field1: string;
  field2: number;
  authContext: AuthContext;
};
~~~

### CA (Config Atom) - 설정 정의

**역할**: 환경변수, 전역 설정값, 서비스별 옵션 정의  
**절대 금지**: 동적 계산, 비즈니스 로직 포함

~~~typescript
// src/atoms/ca/[domain]/CA_[DOMAIN]_CONFIG.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_RETRY_COUNT = 3;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout'
} as const;

// 프로젝트 특수 지침 (예: 배너 반응형 스케일)
export const BANNER_RESPONSIVE_SCALE = {
  DESKTOP: 1.0,
  TABLET: 0.75,
  MOBILE: 0.5
} as const;
~~~

### TA (Trigger Atom) - 트리거 정의

**역할**: 시스템 진입점, 스케줄, 웹훅 엔드포인트 정의  
**절대 금지**: 실제 처리 로직 포함 (FA에서 처리)

~~~typescript
// src/atoms/ta/[domain]/TA_[DOMAIN]_TRIGGERS.ts
export const TA_[TRIGGER_NAME] = {
  id: 'TA_[TRIGGER_NAME]',
  cron: '0 3 * * *',
  flowId: 'FA_[FLOW_NAME]',
  description: '[트리거 설명]'
} as const;
~~~

### EA (Event Atom) - 이벤트 정의

**역할**: 시스템 이벤트 타입과 페이로드 구조 정의  
**절대 금지**: 이벤트 처리 로직 포함 (FA/OA에서 처리)

~~~typescript
// src/atoms/ea/[domain]/EA_[DOMAIN]_EVENTS.ts
export type [EventName] = {
  type: '[EVENT_TYPE]';
  payload: {
    id: string;
    userId: string;
    occurredAt: string;
    metadata?: Record<string, any>;
  };
};
~~~

---

## 2.4 동적 원자 상세 명세

### RA (Rule Atom) - 순수 함수

**역할**: 입력값 검증, 비즈니스 룰 계산, 권한 체크 등 **순수 비즈니스 규칙** 캡슐화  
**핵심 원칙**: 외부 의존성 절대 금지, 동일 입력 → 동일 출력 보장  
**테스트 필수**: 생성 시 Jest/Vitest 단위 테스트 파일 동시 생성

**RA 내부 절대 금지 목록:**
- `fetch(`, `axios.` → QA 또는 OA로 분리
- `db.`, `prisma.` → QA 또는 OA로 분리  
- `localStorage`, `sessionStorage` → OA로 분리
- `document.`, `window.` → UI 컴포넌트로 이동
- Recoil/Zustand/Redux 등 전역 상태 → UI 컴포넌트로 이동

~~~typescript
// src/atoms/ra/[domain]/RA_[DOMAIN]_[ACTION].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';

type [InputType] = {
  field1: string;
  field2: string;
};

type [OutputType] = {
  isValid: boolean;
  score?: number;
  processedData?: any;
};

export const RA_[DOMAIN]_[ACTION] = (
  input: [InputType]
): StandardResult<[OutputType]> => {
  // 순수 로직만 포함 (외부 의존성 절대 금지)
  if (!input.field1 || !input.field2) {
    return {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: '필수 입력값이 누락되었습니다.',
      errorDetail: 'field1, field2는 필수값입니다.'
    };
  }

  // 비즈니스 룰 적용
  const processedData = input.field1.trim().toLowerCase();
  const score = processedData.length * 10;

  return {
    success: true,
    data: {
      isValid: true,
      score,
      processedData
    }
  };
};
~~~

**권한 검증 전용 RA 패턴:**
~~~typescript
// src/atoms/ra/[domain]/RA_[DOMAIN]_CAN_[ACTION].ts
type AuthContext = {
  userId: string;
  roles: string[];
  tenantId?: string;
};

export const RA_[DOMAIN]_CAN_[ACTION] = (
  authContext: AuthContext,
  targetResource: any
): StandardResult<{ canAccess: boolean }> => {
  const hasRole = authContext.roles.includes('[REQUIRED_ROLE]');
  const isOwner = targetResource.ownerId === authContext.userId;

  if (!hasRole && !isOwner) {
    return {
      success: false,
      errorCode: 'PERMISSION_DENIED',
      message: '접근 권한이 없습니다.',
      errorDetail: `Required role: [REQUIRED_ROLE] or ownership`
    };
  }

  return { success: true, data: { canAccess: true } };
};
~~~

---

### QA (Query Atom) - 조회 전용

**역할**: DB 조회, 외부 API GET 요청  
**핵심 원칙**: 읽기 전용, 상태 변경 절대 금지

**에러 처리 원칙:**
- 정상 조회 (데이터 존재): `{ success: true, data: [결과] }`
- 정상 조회 (데이터 없음): `{ success: true, data: null }`  
- DB 에러/타임아웃: `{ success: false, errorCode: 'INTERNAL_ERROR', errorDetail: '...' }`

~~~typescript
// src/atoms/qa/[domain]/QA_[DOMAIN]_[QUERY_NAME].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';
import type { [EntityType] } from '@/atoms/da/[domain]/DA_[DOMAIN]_TYPES';
import { nvLog } from '@/lib/logger';

type [QueryInput] = {
  id: string;
  authContext: {
    userId: string;
    roles: string[];
    tenantId?: string;
    requestId?: string;
  };
};

export const QA_[DOMAIN]_[QUERY_NAME] = async (
  input: [QueryInput]
): Promise<StandardResult<[EntityType] | null>> => {
  nvLog('AT', '▶️ QA_[DOMAIN]_[QUERY_NAME] 시작', { 
    id: input.id,
    userId: input.authContext.userId 
  });

  try {
    // DB 조회 로직
    const data = await db.[table].findUnique({ 
      where: { id: input.id } 
    });

    nvLog('AT', '✅ QA_[DOMAIN]_[QUERY_NAME] 완료', { found: !!data });
    return { 
      success: true, 
      data: data ?? null 
    };

  } catch (error) {
    nvLog('AT', '⛔ QA_[DOMAIN]_[QUERY_NAME] 실패', { error });
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: '조회 중 오류가 발생했습니다.',
      errorDetail: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};
~~~

---

### OA (Operation Atom) - 부수 효과

**역할**: DB CUD, 외부 API POST/PUT/DELETE, 이메일 발송 등  
**핵심 원칙**: 반드시 `rollbackData` 반환, 트랜잭션 실패 시 복구 가능하도록 설계

~~~typescript
// src/atoms/oa/[domain]/OA_[DOMAIN]_[OPERATION_NAME].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';
import type { [EntityType] } from '@/atoms/da/[domain]/DA_[DOMAIN]_TYPES';
import { nvLog } from '@/lib/logger';

type [OperationInput] = {
  field1: string;
  field2: string;
  authContext: {
    userId: string;
    roles: string[];
    tenantId?: string;
    requestId?: string;
  };
};

type [OperationOutput] = {
  id: string;
  createdAt: string;
};

export const OA_[DOMAIN]_[OPERATION_NAME] = async (
  input: [OperationInput]
): Promise<StandardResult<[OperationOutput]>> => {
  nvLog('AT', '▶️ OA_[DOMAIN]_[OPERATION_NAME] 시작', { 
    field1: input.field1,
    userId: input.authContext.userId 
  });

  // 롤백을 위한 이전 상태 저장
  let previousState: [EntityType] | null = null;

  try {
    // 이전 상태 조회 (롤백 데이터 확보)
    previousState = await db.[table].findUnique({ 
      where: { id: input.field1 } 
    });

    // 실제 작업 수행
    const result = await db.[table].create({
      data: {
        field1: input.field1,
        field2: input.field2,
        createdBy: input.authContext.userId,
        tenantId: input.authContext.tenantId
      }
    });

    nvLog('AT', '✅ OA_[DOMAIN]_[OPERATION_NAME] 완료', { id: result.id });
    return {
      success: true,
      data: { id: result.id, createdAt: result.createdAt },
      rollbackData: { 
        previousState, 
        createdId: result.id,
        operation: 'CREATE'
      }
    };

  } catch (error) {
    nvLog('AT', '⛔ OA_[DOMAIN]_[OPERATION_NAME] 실패', { error });
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: '저장 중 오류가 발생했습니다.',
      errorDetail: error instanceof Error ? error.message : '알 수 없는 오류',
      rollbackData: { previousState }
    };
  }
};
~~~

**롤백 원자 표준:**
~~~typescript
// src/atoms/oa/[domain]/OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME].ts
export const OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME] = async (
  rollbackData: any
): Promise<StandardResult<void>> => {
  nvLog('AT', '🔄 OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME] 시작', { rollbackData });

  try {
    if (rollbackData.operation === 'CREATE' && rollbackData.createdId) {
      await db.[table].delete({ where: { id: rollbackData.createdId } });
    } else if (rollbackData.operation === 'UPDATE' && rollbackData.previousState) {
      await db.[table].update({
        where: { id: rollbackData.previousState.id },
        data: rollbackData.previousState
      });
    }

    nvLog('AT', '✅ OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME] 완료');
    return { success: true };

  } catch (error) {
    nvLog('AT', '❌ OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME] 실패', { error });
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: '롤백 중 오류가 발생했습니다.',
      errorDetail: error instanceof Error ? error.message : '롤백 실패'
    };
  }
};
~~~

---

### FA (Flow Atom) - 조립 및 트랜잭션 관리

**역할**: 다른 원자들을 조합하여 완전한 비즈니스 플로우 구현  
**핵심 원칙**:
- FA 내부에서 Recoil/Zustand/Redux 등 전역 상태 직접 변경 **절대 금지**
- 반드시 `StandardResult<T>`만 반환
- 다중 OA 실행 시 Saga 패턴으로 트랜잭션 처리 필수  
- 모든 FA input에 `authContext` 필수 포함

~~~typescript
// src/atoms/fa/[domain]/FA_[FLOW_NAME].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';
import { RA_[DOMAIN]_[VALIDATE] } from '@/atoms/ra/[domain]/RA_[DOMAIN]_[VALIDATE]';
import { RA_[DOMAIN]_CAN_[ACTION] } from '@/atoms/ra/[domain]/RA_[DOMAIN]_CAN_[ACTION]';
import { QA_[DOMAIN]_[QUERY] } from '@/atoms/qa/[domain]/QA_[DOMAIN]_[QUERY]';
import { 
  OA_[DOMAIN]_[OPERATION],
  OA_[DOMAIN]_ROLLBACK_[OPERATION]
} from '@/atoms/oa/[domain]/OA_[DOMAIN]_[OPERATION]';
import { nvLog } from '@/lib/logger';

type [FlowInput] = {
  field1: string;
  field2: string;
  idempotencyKey?: string;  // 중복 실행 방지 (결제 등 고위험 도메인 필수)
  authContext: {
    userId: string;
    roles: string[];
    tenantId?: string;
    requestId?: string;
  };
};

type [FlowOutput] = {
  id: string;
  message: string;
};

export const FA_[FLOW_NAME] = async (
  input: [FlowInput]
): Promise<StandardResult<[FlowOutput]>> => {
  nvLog('AT', '▶️ FA_[FLOW_NAME] 시작', {
    userId: input.authContext.userId,
    requestId: input.authContext.requestId
  });

  // 멱등성 키 중복 실행 방지 (고위험 도메인)
  if (input.idempotencyKey) {
    const duplicate = await QA_CHECK_IDEMPOTENCY(input.idempotencyKey);
    if (duplicate.success && duplicate.data) {
      nvLog('AT', '⚠️ FA_[FLOW_NAME] 멱등성 키 중복 - 기존 결과 반환');
      return duplicate.data;
    }
  }

  // 완료된 OA 스택 (역순 롤백용)
  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // Step 1: 입력값 검증 (RA)
    const validationResult = RA_[DOMAIN]_[VALIDATE]({
      field1: input.field1,
      field2: input.field2
    });
    if (!validationResult.success) {
      return {
        success: false,
        errorCode: validationResult.errorCode,
        message: validationResult.message ?? '입력값이 올바르지 않습니다.',
        errorDetail: validationResult.errorDetail
      };
    }

    // Step 2: 권한 검증 (RA)
    const permissionResult = RA_[DOMAIN]_CAN_[ACTION](
      input.authContext,
      { resourceId: input.field1 }
    );
    if (!permissionResult.success) {
      return {
        success: false,
        errorCode: permissionResult.errorCode,
        message: permissionResult.message ?? '접근 권한이 없습니다.',
        errorDetail: permissionResult.errorDetail
      };
    }

    // Step 3: 중복 여부 조회 (QA)
    const queryResult = await QA_[DOMAIN]_[QUERY]({
      id: input.field1,
      authContext: input.authContext
    });
    if (!queryResult.success) {
      return {
        success: false,
        errorCode: queryResult.errorCode,
        message: '조회 중 오류가 발생했습니다.',
        errorDetail: queryResult.errorDetail
      };
    }
    if (queryResult.data) {
      return {
        success: false,
        errorCode: 'CONFLICT',
        message: '이미 존재하는 데이터입니다.'
      };
    }

    // Step 4: 저장 (OA) - 트랜잭션 시작
    const saveResult = await OA_[DOMAIN]_[OPERATION]({
      field1: validationResult.data!.processedData,
      field2: input.field2,
      authContext: input.authContext
    });
    if (!saveResult.success) {
      return {
        success: false,
        errorCode: saveResult.errorCode,
        message: '저장 중 오류가 발생했습니다.',
        errorDetail: saveResult.errorDetail
      };
    }
    // 롤백 스택에 추가
    completedOAs.push(async () => {
      await OA_[DOMAIN]_ROLLBACK_[OPERATION](saveResult.rollbackData);
    });

    nvLog('AT', '✅ FA_[FLOW_NAME] 성공', { id: saveResult.data!.id });
    return {
      success: true,
      data: { 
        id: saveResult.data!.id, 
        message: '처리가 완료되었습니다.' 
      },
      message: '처리가 완료되었습니다.'
    };

  } catch (error) {
    // 역순 롤백 실행
    nvLog('AT', '⛔ FA_[FLOW_NAME] 실패 - 롤백 시작', { error });

    for (const rollback of completedOAs.reverse()) {
      try {
        await rollback();
        nvLog('AT', '🔄 롤백 성공');
      } catch (rollbackError) {
        nvLog('AT', '❌ 롤백 실패 - 수동 확인 필요', { rollbackError });
      }
    }

    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: '처리 중 오류가 발생했습니다.',
      errorDetail: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};
~~~

---

## 2.5 Context Mapping 표준

FA의 YAML 설계에서 단계 간 데이터 전달은 반드시 아래 규칙을 따릅니다.

~~~yaml
context_mapping_rules:
  initial_input: "context.input.[필드명]"
  step_output: "context.[stepName]Result.[필드명]"

  correct_examples:
    - "context.input.email"
    - "context.input.authContext.userId"
    - "context.userResult.data.userId"
    - "context.validationResult.data.processedData"

  wrong_examples:
    - "step1.data"           # ❌ context 접두사 누락
    - "context.step1"        # ❌ Result 접미사 누락  
    - "userResult.data"      # ❌ context. 접두사 누락
    - "context.input.user"   # ❌ 존재하지 않는 필드 참조
~~~

---

## 2.6 트랜잭션(Transaction) 처리 원칙 ⭐

FA 안에서 여러 OA가 순차 실행될 때, **하나라도 실패하면 앞서 성공한 OA를 반드시 롤백**해야 합니다.

### 2.6.1 핵심 원칙
- 다중 OA 실행 = 트랜잭션으로 간주
- 각 OA는 `rollbackData`를 반드시 반환
- FA는 실패 시 역순으로 보상 트랜잭션 실행 (Saga 패턴)

### 2.6.2 YAML 설계 시 트랜잭션 명시

다중 OA가 포함된 Flow 설계 시 YAML에 반드시 `transaction: true`와 `rollback_atom` 명시:

~~~yaml
FA_[FLOW_NAME]:
  id: "FA_[FLOW_NAME]"
  type: "flow"
  transaction: true        # 다중 OA = 트랜잭션 명시 필수
  description: "[플로우 설명]"

  input:
    field1: "string"
    field2: "number"
    idempotencyKey: "string (optional)"
    authContext:
      userId: "string"
      roles: "string[]"
      tenantId: "string (optional)"
      requestId: "string (optional)"

  output:
    success: "boolean"
    data: "object"
    message: "string"
    errorCode: "AtomErrorCode (optional)"

  steps:
    - step: 1
      name: "[검증 단계]"
      atom: "RA_[VALIDATE_INPUT]"
      input_mapping:
        field1: "context.input.field1"
        field2: "context.input.field2"
      output_save_as: "validationResult"

    - step: 2
      name: "[권한 검증]"
      atom: "RA_[CHECK_PERMISSION]"
      input_mapping:
        authContext: "context.input.authContext"
        resourceId: "context.input.field1"
      output_save_as: "permissionResult"

    - step: 3
      name: "[조회 단계]"
      atom: "QA_[CHECK_EXISTS]"
      input_mapping:
        field1: "context.input.field1"
        authContext: "context.input.authContext"
      output_save_as: "queryResult"

    - step: 4
      name: "[첫 번째 저장 단계]"
      atom: "OA_[FIRST_OPERATION]"
      input_mapping:
        processedData: "context.validationResult.data.processedData"
        authContext: "context.input.authContext"
      output_save_as: "firstResult"
      rollback_atom: "OA_[ROLLBACK_FIRST]"

    - step: 5
      name: "[두 번째 저장 단계]"
      atom: "OA_[SECOND_OPERATION]"
      input_mapping:
        field2: "context.input.field2"
        firstId: "context.firstResult.data.id"
        authContext: "context.input.authContext"
      output_save_as: "secondResult"
      rollback_atom: "OA_[ROLLBACK_SECOND]"
~~~

---

## 2.7 보안 컨텍스트 전파 표준 ⭐

### 2.7.1 authContext 필수 구조

모든 FA와 QA/OA의 input에는 아래 구조의 `authContext`가 포함되어야 합니다:

~~~typescript
type AuthContext = {
  userId: string;       // 필수: 요청자 식별
  roles: string[];      // 필수: 역할 기반 접근 제어
  tenantId?: string;    // 선택: 멀티 테넌트 환경
  requestId?: string;   // 선택: 요청 추적 (로깅/디버깅)
};
~~~

### 2.7.2 FA에서 권한 검증 순서

~~~text
FA 내부 권한 검증 필수 순서:

Step 1. RA_[DOMAIN]_CAN_[ACTION] 호출 (권한 검증 RA)
Step 2. 실패 시 즉시 { success: false, errorCode: 'PERMISSION_DENIED' } 반환
Step 3. 성공 시에만 QA/OA 단계 진행
~~~

---

## 2.8 Flow Atom YAML 기본 템플릿

### 단일 OA Flow (트랜잭션 불필요)

~~~yaml
FA_[FLOW_NAME]:
  id: "FA_[FLOW_NAME]"
  type: "flow"
  transaction: false
  description: "[플로우 설명]"

  input:
    field1: "string"
    field2: "string"
    authContext:
      userId: "string"
      roles: "string[]"

  output:
    success: "boolean"
    data: "object"
    message: "string"
    errorCode: "AtomErrorCode (optional)"

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
        authContext: "context.input.authContext"
      output_save_as: "queryResult"

    - step: 3
      name: "[저장 단계]"
      atom: "OA_[SAVE_DATA]"
      input_mapping:
        processedData: "context.validationResult.data.processedData"
        authContext: "context.input.authContext"
      output_save_as: "saveResult"
~~~

---

## 2.9 파일 경로 및 네이밍 표준

### 파일 경로 구조
~~~text
YAML 설계도:
  atoms/[domain]/[atom-type]-atoms/

TypeScript 구현:
  src/atoms/da/[domain]/DA_[DOMAIN]_TYPES.ts
  src/atoms/ca/[domain]/CA_[DOMAIN]_CONFIG.ts
  src/atoms/ta/[domain]/TA_[DOMAIN]_TRIGGERS.ts
  src/atoms/ea/[domain]/EA_[DOMAIN]_EVENTS.ts
  src/atoms/ra/[domain]/RA_[DOMAIN]_[ACTION].ts
  src/atoms/qa/[domain]/QA_[DOMAIN]_[QUERY].ts
  src/atoms/oa/[domain]/OA_[DOMAIN]_[OPERATION].ts
  src/atoms/fa/[domain]/FA_[FLOW_NAME].ts

공통 에러 타입:
  src/atoms/da/common/DA_COMMON_ERROR_TYPES.ts

테스트 파일:
  src/atoms/ra/[domain]/RA_[DOMAIN]_[ACTION].test.ts
~~~

### 네이밍 규칙
- **DA**: `DA_[DOMAIN]_[ENTITY]_TYPES`
- **CA**: `CA_[DOMAIN]_[CONFIG_NAME]`
- **TA**: `TA_[DOMAIN]_[TRIGGER_NAME]`
- **EA**: `EA_[DOMAIN]_[EVENT_NAME]`
- **RA**: `RA_[DOMAIN]_[ACTION]` (예: `RA_AUTH_VALIDATE_PASSWORD`)
- **QA**: `QA_[DOMAIN]_GET_[ENTITY]` (예: `QA_USER_GET_PROFILE`)
- **OA**: `OA_[DOMAIN]_[ACTION]_[ENTITY]` (예: `OA_USER_UPDATE_PROFILE`)
- **FA**: `FA_[DOMAIN]_[USECASE]` (예: `FA_AUTH_LOGIN_FLOW`)

---

## 2.10 색인과 Atom의 관계

- **Flow Atom**은 색인 맵(`docs/project_map.yaml`)의 `flows` 필드에 연결
- **Trigger Atom**은 색인 맵의 `triggers` 필드에 연결
- **Event Atom**은 색인 맵의 `events` 필드에 연결
- Flow 관련 수정 시 연관 페이지/컴포넌트 영향도 반드시 확인
- 필요시 프로세스 문서(`docs/processes/`) 갱신

---

## 2.11 테스트 전략 표준화

### RA 테스트 기준 (필수)
모든 RA 생성 시 Jest/Vitest 테스트 파일 동시 생성:

~~~typescript
// src/atoms/ra/[domain]/RA_[DOMAIN]_[ACTION].test.ts
import { RA_[DOMAIN]_[ACTION] } from './RA_[DOMAIN]_[ACTION]';

describe('RA_[DOMAIN]_[ACTION]', () => {
  it('정상 입력 시 success: true 반환', () => {
    const result = RA_[DOMAIN]_[ACTION]({ field1: '값1', field2: '값2' });
    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
  });

  it('필수값 누락 시 VALIDATION_FAILED 반환', () => {
    const result = RA_[DOMAIN]_[ACTION]({ field1: '', field2: '값2' });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('VALIDATION_FAILED');
  });

  it('경계값 처리 정상 동작', () => {
    // 경계값 케이스 작성
  });
});
~~~

### QA/OA 테스트 기준
- 외부 의존성(DB, API) 완전 mocking 처리
- **QA**: 성공(데이터 있음), 성공(데이터 없음), 실패 케이스
- **OA**: 성공, 실패, `rollbackData` 생성 여부 검증

### FA 테스트 기준
- 포함된 QA/OA mocking하여 통합 비즈니스 로직 검증
- **트랜잭션 롤백 시나리오 검증 필수**: 중간 OA 실패 시 이전 OA 롤백 함수 호출 확인

---

## 2.12 원자 생성 시 AI 필수 체크리스트

새로운 원자를 생성할 때 아래 항목을 순서대로 확인합니다:

~~~text
□ 1. 색인 맵(docs/project_map.yaml)에 해당 도메인 항목이 있는가?
□ 2. 프로젝트 특수 지침(docs/project_rules/)을 먼저 확인했는가?
□ 3. 동일한 역할의 원자가 이미 존재하지 않는가? (중복 방지)
□ 4. 원자 타입(DA/CA/TA/EA/RA/QA/OA/FA)이 역할에 맞게 선택되었는가?
□ 5. DA_COMMON_ERROR_TYPES의 StandardResult<T>를 반환 타입으로 사용하는가?
□ 6. FA/OA에 nvLog('AT', ...) 호출이 포함되어 있는가?
□ 7. OA에 rollbackData가 반환값에 포함되어 있는가?
□ 8. FA input에 authContext가 포함되어 있는가?
□ 9. RA에 외부 의존성(fetch, db, localStorage 등)이 없는가?
□ 10. FA 내부에서 전역 상태(Zustand/Recoil/Redux)를 직접 변경하지 않는가?
□ 11. 다중 OA인 경우 transaction: true와 rollback_atom이 YAML에 명시되어 있는가?
□ 12. RA 생성 시 테스트 파일(*.test.ts)이 함께 생성되었는가?
~~~

---

## 2.13 요약

- **8-Atom은 SSOT 아키텍처의 핵심 단위**이며, 레거시/프로젝트 특수 지침도 이 구조를 깨서는 안 됩니다.
- 모든 동적 원자는 `StandardResult<T>` 및 `AtomErrorCode` 체계를 따릅니다.
- **RA는 순수 함수**, **QA는 조회 전용**, **OA는 부수 효과 + 롤백 고려**, **FA는 조립 + 트랜잭션 관리**만 담당합니다.
- 트랜잭션이 필요한 Flow는 YAML 설계에서 `transaction: true`와 `rollback_atom`을 반드시 명시합니다.
- 모든 FA와 QA/OA는 보안 컨텍스트(`authContext`) 전파를 통해 권한 검증을 수행합니다.

구체적인 React/Next.js 연동 및 상태 관리 규칙은 `03_integration_logging.md`에서 정의합니다.
