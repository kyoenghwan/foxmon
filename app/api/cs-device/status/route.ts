import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, message: '토큰이 누락되었습니다.' }, { status: 400 });
    }

    const { data: device, error } = await supabaseAdmin
      .from('cs_approved_devices')
      .select('device_name, status')
      .eq('device_token', token)
      .maybeSingle();

    if (error) {
      nvLog('FW', '❌ cs-device/status API 조회 실패', error.message);
      return NextResponse.json({ success: false, message: '조회 실패' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      device: device || null,
    });
  } catch (err: any) {
    nvLog('FW', '❌ cs-device/status API 예외', err.message);
    return NextResponse.json({ success: false, message: '서버 에러' }, { status: 500 });
  }
}
