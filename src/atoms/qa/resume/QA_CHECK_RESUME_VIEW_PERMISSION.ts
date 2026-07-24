'use server';

import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { isAdminRole } from '@/lib/normalize-user-role';

interface PermissionResult {
  hasPermission: boolean;
  reason?: 'NOT_LOGGED_IN' | 'NO_JOB_POST' | 'UNKNOWN_ERROR';
}

/**
 * 인재 정보 상세 열람 권한을 체크합니다.
 * 조건: 
 * 1. 로그인 상태여야 함.
 * 2. ADMIN/SUPER_ADMIN 은 무조건 통과.
 * 3. 일반/업체 회원은 본인이 작성한 구인 공고(jobs)가 최소 1개 이상 존재해야 함.
 */
export async function QA_CHECK_RESUME_VIEW_PERMISSION(): Promise<PermissionResult> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return { hasPermission: false, reason: 'NOT_LOGGED_IN' };
    }

    // 1. 관리자 권한은 무조건 허용
    const userRole = user.role || '';
    if (isAdminRole(userRole)) {
      return { hasPermission: true };
    }

    // 2. 해당 유저가 작성한 구인 공고(jobs)가 최소 1개 이상 있는지 체크
    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('QA_CHECK_RESUME_VIEW_PERMISSION error:', error);
      return { hasPermission: false, reason: 'UNKNOWN_ERROR' };
    }

    const hasJob = (count || 0) > 0;
    if (!hasJob) {
      return { hasPermission: false, reason: 'NO_JOB_POST' };
    }

    return { hasPermission: true };
  } catch (e) {
    console.error('QA_CHECK_RESUME_VIEW_PERMISSION caught error:', e);
    return { hasPermission: false, reason: 'UNKNOWN_ERROR' };
  }
}
