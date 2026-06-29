import { RA_HASH_PASSWORD } from '@/src/atoms/ra/auth/RA_HASH_PASSWORD';
import { RA_VALIDATE_LOGIN_ID } from '@/src/atoms/ra/auth/RA_LOGIN_ID';
import { QA_CHECK_ID_NICKNAME_EXISTS } from '@/src/atoms/qa/auth/QA_CHECK_ID_NICKNAME_EXISTS';
import { OA_CREATE_USER } from '@/src/atoms/oa/auth/OA_CREATE_USER';
import { QA_CHECK_CI_ELIGIBILITY } from '@/src/atoms/qa/auth/QA_CHECK_CI_ELIGIBILITY';
import { OA_UPSERT_CI_HISTORY } from '@/src/atoms/oa/auth/OA_UPSERT_CI_HISTORY';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface RegisterInput {
  loginId: string;
  password: string;
  email?: string;
  name: string;
  nickname: string;
  role: 'GENERAL' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN';
  birthDate: string;
  gender: string;
  phoneNumber: string;
  nationality: string;
  is_age_verified: boolean;
  ci?: string;
  business_name?: string;
  representative_name?: string;
  business_number?: string;
  business_category?: string;
  opening_date?: string;
  smsConsent: boolean;
  business_type?: string;
  business_address?: string;
  verification_doc_url?: string;
  referrerLoginId?: string; // 추천인 아이디 필드 추가
}

/**
 * FA_REGISTER_FLOW: 사용자 회원가입 전체 프로세스 (v2.0)
 */
export async function FA_REGISTER_FLOW(input: RegisterInput): Promise<{ success: boolean; message: string }> {
  nvLog('AT', '▶️ FA_REGISTER_FLOW 시작', { loginId: input.loginId, role: input.role });

  try {
    const loginIdCheck = RA_VALIDATE_LOGIN_ID(input.loginId);
    if (!loginIdCheck.isValid) {
      return { success: false, message: loginIdCheck.error || '사용할 수 없는 아이디입니다.' };
    }
    const loginId = loginIdCheck.normalized;

    // 1. 아이디 및 닉네임 중복 확인
    const duplicateCheck = await QA_CHECK_ID_NICKNAME_EXISTS({
      loginId,
      nickname: input.nickname
    });

    if (duplicateCheck.error) {
      return { success: false, message: '중복 검사 중 시스템 오류가 발생했습니다.' };
    }
    if (duplicateCheck.data?.idExists) {
      return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }
    if (duplicateCheck.data?.nicknameExists) {
      return { success: false, message: '이미 사용 중인 닉네임입니다.' };
    }

    // 2. 추천인 유효성 체크 및 referrer_id 조회
    let referrerId: string | null = null;
    if (input.referrerLoginId) {
      const trimmedReferrer = input.referrerLoginId.trim();
      if (trimmedReferrer.toLowerCase() === loginId.toLowerCase()) {
        return { success: false, message: '본인은 추천인으로 등록할 수 없습니다.' };
      }
      
      const { data: referrer, error: refError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('login_id', trimmedReferrer)
        .single();

      if (refError || !referrer) {
        return { success: false, message: '존재하지 않는 추천인 아이디입니다.' };
      }
      referrerId = referrer.id;
    }

    // 3. 비밀번호 해싱
    const hashResult = await RA_HASH_PASSWORD(input.password);

    // 4. 사용자 생성 (DB 필드명에 맞춰 키 매핑)
    const createResult = await OA_CREATE_USER({
      login_id: loginId,
      password: hashResult.data,
      email: input.email,
      name: input.name,
      nickname: input.nickname,
      role: input.role,
      birth_date: input.birthDate,
      gender: input.gender,
      phone_number: input.phoneNumber,
      nationality: input.nationality,
      is_age_verified: input.is_age_verified,
      ci: input.ci || null,
      business_name: input.business_name,
      representative_name: input.representative_name,
      business_number: input.business_number,
      business_category: input.business_category,
      opening_date: input.opening_date,
      business_type: input.business_type,
      business_address: input.business_address,
      verification_doc_url: input.verification_doc_url,
      sms_consent: input.smsConsent,
      referrer_id: referrerId, // 추천인 매핑
    });

    if (!createResult.success || !createResult.data) {
      return { success: false, message: createResult.error || '회원가입 중 오류가 발생했습니다.' };
    }

    const newUserId = createResult.data.userId;

    // 5. CI 이력 조회를 통한 재가입 포인트 어뷰징 검증
    let isEligibleForPoints = true;
    if (input.ci) {
      const ciEligibility = await QA_CHECK_CI_ELIGIBILITY({ ci: input.ci });
      if (ciEligibility.success && ciEligibility.data) {
        if (ciEligibility.data.exists && !ciEligibility.data.isEligible) {
          isEligibleForPoints = false;
          nvLog('AT', '⚠️ 재가입 어뷰징 감지: 포인트 지급 대상 제외', { ci: '***' });
        }
      }
    }

    // 6. 가입 성공 후 추천 포인트 지급 연동 (RPC 호출)
    if (referrerId && isEligibleForPoints) {
      let referralSignupAmt = 500;
      let referralBonusAmt = 1000;
      try {
        const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
        const policiesRes = await GET_POINT_POLICIES();
        if (policiesRes.success && policiesRes.data) {
          const signupPolicy = policiesRes.data.find((p: any) => p.config_key === 'ACTIVITY_REFERRAL_SIGNUP');
          const bonusPolicy = policiesRes.data.find((p: any) => p.config_key === 'ACTIVITY_REFERRAL_BONUS');
          if (signupPolicy) referralSignupAmt = signupPolicy.config_value;
          if (bonusPolicy) referralBonusAmt = bonusPolicy.config_value;
        }
      } catch (err: any) {
        nvLog('AT', '⚠️ 추천 포인트 정책 조회 실패, 기본값 사용', err?.message);
      }

      // 신규 가입자 포인트 적립
      const { error: userBonusErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: newUserId,
        p_type: 'REFERRAL_SIGNUP',
        p_amount: referralSignupAmt,
        p_description: '가입 추천인 입력 보너스 적립'
      });

      // 추천한 사람 포인트 적립
      const { error: refBonusErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: referrerId,
        p_type: 'REFERRAL_BONUS',
        p_amount: referralBonusAmt,
        p_description: `추천 가입 보너스 적립 (가입자: ${loginId})`
      });

      if (userBonusErr || refBonusErr) {
        nvLog('AT', '⚠️ 추천 포인트 적립 중 일부 오류 발생', { userBonusErr, refBonusErr });
      } else if (input.ci) {
        // 포인트 지급 완료 상태 기록 (중복 지급 차단)
        await OA_UPSERT_CI_HISTORY({ ci: input.ci, action: 'MARK_USED' });
      }
    }

    // 7. 가입 이력 기록 (재가입 방지용)
    if (input.ci) {
      await OA_UPSERT_CI_HISTORY({ ci: input.ci, action: 'SIGNUP' });
    }

    nvLog('AT', '✅ FA_REGISTER_FLOW 완료');
    return { success: true, message: '회원가입이 완료되었습니다.' };
  } catch (err: any) {
    nvLog('AT', '❌ FA_REGISTER_FLOW 시스템 에러', err.message);
    return { success: false, message: '시스템 오류가 발생했습니다.' };
  }
}
