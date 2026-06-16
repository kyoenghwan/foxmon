import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// 네이버 지도 Client ID를 공개적으로 제공하는 엔드포인트
// (Client ID는 프론트엔드 JS에서 사용되는 공개 키이므로 인증 불필요)
export async function GET() {
  nvLog('AT', `[Map Settings API] GET 요청 수신 - Client ID 조회 중...`);
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('key_value')
      .eq('key_name', 'naver_map_client_id')
      .single();

    if (error || !data?.key_value) {
      nvLog('AT', `[Map Settings API] 경고 - DB에서 naver_map_client_id를 찾지 못함`, error);
      return NextResponse.json({ clientId: null });
    }

    nvLog('AT', `[Map Settings API] 성공 - Client ID 조회 완료: ${data.key_value.slice(0, 4)}***`);
    return NextResponse.json({ clientId: data.key_value });
  } catch (err) {
    nvLog('AT', `[Map Settings API] 에러 - 처리 중 예외 발생`, err);
    return NextResponse.json({ clientId: null });
  }
}
