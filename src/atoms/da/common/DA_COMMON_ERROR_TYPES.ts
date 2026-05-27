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
  errorDetail?: string;       // 개발자용 상세 정보
  rollbackData?: any;         // OA 전용: 트랜잭션 롤백에 필요한 이전 상태
};
