# React 통합 및 상태 관리 보일러플레이트 부록

이 파일은 `docs/templates/react_boilerplate_templates.md` 입니다.
UI 컴포넌트나 클라이언트 로직을 작성할 때 AI가 참고해야 하는 React, React Query, Zustand 연동 등에 대한 구체적인 코드 예시 및 템플릿입니다.

---

## 1. FA(Flow Atom) 연동 기본 패턴 (폼 제출)

FA(비즈니스 로직) 내부에서는 절대 전역 상태(Zustand 등)를 수정해서는 안 됩니다. **상태 변경은 오직 이 패턴처럼 UI 컴포넌트에서만 이뤄져야 합니다.**

~~~typescript
import { FA_[FLOW_NAME] } from '@/atoms/fa/[domain]/FA_[FLOW_NAME]';
import { nvLog } from '@/lib/logger';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/auth';

const ComponentName = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormDataType) => {
    // 동시성 제어 방어막
    if (isSubmitting) return;
    setIsSubmitting(true);

    nvLog('FW', '[폼명] 제출 시도', formData);

    try {
      const result = await FA_[FLOW_NAME]({
        ...formData,
        authContext: {
          userId: currentUser.id,
          roles: currentUser.roles,
          requestId: crypto.randomUUID()
        }
      });

      if (result.success) {
        // ✅ 상태 변경은 반드시 FA 외부(UI 레이어)에서 수행!
        setUser(result.data.user);
        router.push('/success-path');
        toast.success(result.message);
      } else {
        handleErrorCode(result.errorCode);
      }
    } catch (error) {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // JSX 구현...
  );
};
~~~

---

## 2. React Query + QA 직접 연동 (GET 전용 특례)

순수 데이터 조회(GET)에 한해 UI 컴포넌트에서 `useQuery`를 통해 QA를 직접 호출하는 방식입니다. 변경(Mutation) 작업은 무조건 FA를 거쳐야 합니다.

~~~typescript
import { useQuery } from '@tanstack/react-query';
import { QA_USER_GET_PROFILE } from '@/atoms/qa/user/QA_USER_GET_PROFILE';

export const useUserProfile = (userId: string, authContext: AuthContext) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const result = await QA_USER_GET_PROFILE({ id: userId, authContext });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: !!userId
  });
};
~~~

---

## 3. React Query Mutation + FA 연동

데이터 변경 작업을 위해 `useMutation` 내부에서 FA를 호출하는 표준 패턴입니다.

~~~typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FA_USER_UPDATE_PROFILE } from '@/atoms/fa/user/FA_USER_UPDATE_PROFILE';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const result = await FA_USER_UPDATE_PROFILE({
        ...data,
        authContext: getCurrentAuthContext()
      });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data) => {
      // ✅ 외부(UI 레이어)에서 상태 업데이트 및 무효화
      queryClient.invalidateQueries(['userProfile']);
      toast.success('프로필이 업데이트되었습니다.');
    }
  });
};
~~~

---

## 4. 백엔드 에러 코드 핸들러 패턴 (`handleErrorCode`)

서버의 `AtomErrorCode`를 클라이언트의 UI 피드백으로 매핑하는 보일러플레이트입니다.

~~~typescript
import type { AtomErrorCode } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';
import { toast } from 'sonner';

export const handleErrorCode = (errorCode?: AtomErrorCode) => {
  switch (errorCode) {
    case 'VALIDATION_FAILED':
      toast.error('입력값을 다시 확인해주세요.');
      break;
    case 'NOT_FOUND':
      toast.error('요청하신 정보를 찾을 수 없습니다.');
      break;
    case 'PERMISSION_DENIED':
      toast.error('접근 권한이 없습니다.');
      // router.push('/unauthorized'); 등 필요시 추가
      break;
    case 'CONFLICT':
      toast.error('이미 존재하는 데이터입니다.');
      break;
    case 'RATE_LIMITED':
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      break;
    case 'EXTERNAL_SERVICE_ERROR':
      toast.error('외부 서비스 오류입니다. 잠시 후 다시 시도해주세요.');
      break;
    default:
      toast.error('알 수 없는 오류가 발생했습니다.');
  }
};
~~~

---

## 5. FA 멱등성 키(idempotencyKey) 방어 패턴

특히 결제, 주문 등 중복 발생이 치명적인 도메인에서 FA 원자 쪽에서 어떻게 멱등성을 방어하는지에 대한 템플릿입니다.

~~~typescript
export const FA_[FLOW_NAME] = async (
  input: InputType & { idempotencyKey?: string }
): Promise<StandardResult<OutputType>> => {
  // 1. 멱등성 검사
  if (input.idempotencyKey) {
    const duplicate = await QA_CHECK_IDEMPOTENCY(input.idempotencyKey);
    if (duplicate.success && duplicate.data) {
      nvLog('AT', '⚠️ 멱등성 키 중복 - 기존 결과 반환', { key: input.idempotencyKey });
      return duplicate.data; // 기존 결과 그대로 반환
    }
  }
  
  // 2. 실제 비즈니스 로직 연산 수행...
  // ...
};
~~~
