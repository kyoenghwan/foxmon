# 8-Atom TypeScript & YAML Boilerplate Templates

이 문서는 8-Atom 아키텍처를 준수하기 위해 필요한 보일러플레이트 코드와 패턴 예시를 모아둔 템플릿(부록) 저장소입니다. AI는 코드 작성 시 이 템플릿을 참고하여 동일한 구조와 에러 반환 패턴을 구현해야 합니다.

## 1. 공통 에러 코드 표준 (Error Code SSOT)

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
  errorDetail?: string;   // 개발자용 상세 정보
  rollbackData?: any;     // OA 전용: 트랜잭션 롤백에 필요한 이전 상태
};
~~~

## 2. 정적 원자 양식

### DA (Data Atom), CA (Config Atom), TA (Trigger Atom), EA (Event Atom)
~~~typescript
// src/atoms/da/[domain]/DA_[DOMAIN]_TYPES.ts
export type [EntityName] = { id: string; status: [StatusName]; };
export enum [StatusName] { ACTIVE = 'ACTIVE' }

// src/atoms/ca/[domain]/CA_[DOMAIN]_CONFIG.ts
export const DEFAULT_PAGE_SIZE = 20;

// src/atoms/ta/[domain]/TA_[DOMAIN]_TRIGGERS.ts
export const TA_[TRIGGER_NAME] = { id: 'TA_[TRIGGER]', cron: '0 3 * * *', flowId: 'FA_[FLOW]' } as const;

// src/atoms/ea/[domain]/EA_[DOMAIN]_EVENTS.ts
export type [EventName] = { type: '[EVENT_TYPE]'; payload: { id: string; } };
~~~

## 3. 동적 원자 양식

### 3.1 RA (Rule Atom) - 순수 함수
~~~typescript
// src/atoms/ra/[domain]/RA_[DOMAIN]_[ACTION].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';

export const RA_[DOMAIN]_[ACTION] = (
  input: [InputType]
): StandardResult<[OutputType]> => {
  // DB, 외부API 호출 금지!
  if (!input.field1) {
    return {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: '필수 입력값이 누락되었습니다.'
    };
  }
  return { success: true, data: { isValid: true } };
};

// 권한 검증 전용 RA
export const RA_[DOMAIN]_CAN_[ACTION] = (
  authContext: AuthContext,
  targetResource: any
): StandardResult<{ canAccess: boolean }> => {
  if (!authContext.roles.includes('ADMIN')) {
    return { success: false, errorCode: 'PERMISSION_DENIED', message: '권한 부족' };
  }
  return { success: true, data: { canAccess: true } };
};
~~~

### 3.2 QA (Query Atom) - 읽기 전용
~~~typescript
// src/atoms/qa/[domain]/QA_[DOMAIN]_[QUERY_NAME].ts
import type { StandardResult } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';
import { nvLog } from '@/lib/logger';

export const QA_[DOMAIN]_[QUERY_NAME] = async (
  input: [QueryInput]
): Promise<StandardResult<[EntityType] | null>> => {
  nvLog('AT', '▶️ QA_[DOMAIN]_[QUERY_NAME] 시작', input);
  try {
    const data = await db.[table].findUnique({ where: { id: input.id } });
    return { success: true, data: data ?? null };
  } catch (error) {
    return { success: false, errorCode: 'INTERNAL_ERROR', message: '조회 실패' };
  }
};
~~~

### 3.3 OA (Operation Atom) - 트랜잭션 단위
~~~typescript
// src/atoms/oa/[domain]/OA_[DOMAIN]_[OPERATION_NAME].ts
export const OA_[DOMAIN]_[OPERATION_NAME] = async (
  input: [OperationInput]
): Promise<StandardResult<[OperationOutput]>> => {
  nvLog('AT', '▶️ OA_...', input);
  let previousState = null;

  try {
    previousState = await db.[table].findUnique({ where: { id: input.id } }); // 롤백용 저장
    const result = await db.[table].update({ data: { ... } });
    return {
      success: true,
      data: result,
      rollbackData: { previousState, operation: 'UPDATE' } // 필수 반환
    };
  } catch (error) {
    return { success: false, errorCode: 'INTERNAL_ERROR', rollbackData: { previousState } };
  }
};

// 롤백 전용 원자
export const OA_[DOMAIN]_ROLLBACK_[OPERATION_NAME] = async (rollbackData: any): Promise<StandardResult<void>> => {
  if (rollbackData.operation === 'UPDATE' && rollbackData.previousState) {
    await db.[table].update({ where: { id: rollbackData.previousState.id }, data: rollbackData.previousState });
  }
  return { success: true };
};
~~~

### 3.4 FA (Flow Atom) - 트랜잭션 보장 플로우
~~~typescript
// src/atoms/fa/[domain]/FA_[FLOW_NAME].ts
export const FA_[FLOW_NAME] = async (input: [FlowInput]): Promise<StandardResult<[FlowOutput]>> => {
  nvLog('AT', '▶️ FA_[FLOW_NAME] 시작');
  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // 1. RA 검증
    const valResult = RA_VALIDATE(input);
    if (!valResult.success) return valResult;

    // 2. 권한 검증
    const permResult = RA_CAN_ACCESS(input.authContext, input);
    if (!permResult.success) return permResult;

    // 3. OA 실행 및 롤백 예약
    const oaResult = await OA_DO_SOMETHING(input);
    if (!oaResult.success) throw oaResult; // Error Code Throw
    completedOAs.push(async () => { await OA_ROLLBACK_SOMETHING(oaResult.rollbackData); });

    return { success: true, data: oaResult.data, message: '완료' };

  } catch (error) {
    for (const rollback of completedOAs.reverse()) await rollback(); // 역순 롤백
    return { success: false, errorCode: 'INTERNAL_ERROR', message: '오류 발생, 롤백됨.' };
  }
};
~~~

## 4. Context Mapping 표준 (YAML)
~~~yaml
context_mapping_rules:
  initial_input: "context.input.[필드명]"
  step_output: "context.[stepName]Result.[필드명]"
  correct_examples:
    - "context.input.email"
    - "context.userResult.data.userId"
~~~
