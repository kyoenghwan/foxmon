'use server';

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * 기기 등록 신청 (누구나 신청할 수 있으나 승인 전까진 대기 상태)
 */
export async function requestDeviceRegistration(payload: {
  deviceToken: string;
  deviceName: string;
}) {
  const { deviceToken, deviceName } = payload;
  if (!deviceToken || !deviceName.trim()) {
    return { success: false, message: '기기명과 토큰이 필요합니다.' };
  }

  try {
    // 1. 기존 신청이 있는지 체크
    const { data: existing } = await supabaseAdmin
      .from('cs_approved_devices')
      .select('status')
      .eq('device_token', deviceToken)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'APPROVED') {
        return { success: true, message: '이미 승인 완료된 기기입니다.' };
      }
      if (existing.status === 'PENDING') {
        return { success: true, message: '이미 등록 신청이 완료되어 대기 중입니다.' };
      }
      // REJECTED인 경우 재신청 가능하도록 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('cs_approved_devices')
        .update({
          device_name: deviceName.trim(),
          status: 'PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('device_token', deviceToken);

      if (updateError) throw updateError;
      return { success: true, message: '승인 반려된 기기에 대한 재신청이 완료되었습니다.' };
    }

    // 2. 신규 등록
    const { error: insertError } = await supabaseAdmin
      .from('cs_approved_devices')
      .insert({
        device_token: deviceToken,
        device_name: deviceName.trim(),
        status: 'PENDING',
      });

    if (insertError) {
      nvLog('FW', '❌ CS 기기 등록 신청 실패', insertError.message);
      return { success: false, message: '기기 신청 중 오류가 발생했습니다.' };
    }

    // 쿠키에도 기기 토큰 강제 적재 (검증 대기용)
    const cookieStore = await cookies();
    cookieStore.set('cs_device_token', deviceToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1년
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { success: true, message: '기기 등록 신청이 완료되었습니다. 관리자 승인을 대기해 주세요.' };
  } catch (err: any) {
    nvLog('FW', '❌ CS 기기 등록 신청 에러', err.message);
    return { success: false, message: '오류가 발생했습니다. 다시 시도해 주세요.' };
  }
}

/**
 * CS 기기 승인 처리
 */
export async function approveDevice(deviceId: string) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!session?.user?.id || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!deviceId) return { success: false, message: '기기 ID가 누락되었습니다.' };

  try {
    const { error } = await supabaseAdmin
      .from('cs_approved_devices')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (error) {
      nvLog('FW', '❌ 기기 승인 처리 실패', error.message);
      return { success: false, message: '기기 승인에 실패했습니다.' };
    }

    revalidatePath('/fox-office/support/staff');
    return { success: true, message: '기기 승인이 정상 완료되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 기기 승인 에러', err.message);
    return { success: false, message: '오류가 발생했습니다.' };
  }
}

/**
 * CS 기기 반려 처리
 */
export async function rejectDevice(deviceId: string) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!session?.user?.id || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!deviceId) return { success: false, message: '기기 ID가 누락되었습니다.' };

  try {
    const { error } = await supabaseAdmin
      .from('cs_approved_devices')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (error) {
      nvLog('FW', '❌ 기기 반려 처리 실패', error.message);
      return { success: false, message: '기기 반려에 실패했습니다.' };
    }

    revalidatePath('/fox-office/support/staff');
    return { success: true, message: '기기 반려 처리가 완료되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 기기 반려 에러', err.message);
    return { success: false, message: '오류가 발생했습니다.' };
  }
}

/**
 * CS 기기 데이터 삭제
 */
export async function deleteDevice(deviceId: string) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!session?.user?.id || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!deviceId) return { success: false, message: '기기 ID가 누락되었습니다.' };

  try {
    const { error } = await supabaseAdmin
      .from('cs_approved_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      nvLog('FW', '❌ 기기 삭제 실패', error.message);
      return { success: false, message: '기기 삭제에 실패했습니다.' };
    }

    revalidatePath('/fox-office/support/staff');
    return { success: true, message: '기기 정보가 삭제되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 기기 삭제 에러', err.message);
    return { success: false, message: '오류가 발생했습니다.' };
  }
}
