import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 네이버 지도 Client ID를 공개적으로 제공하는 엔드포인트
// (Client ID는 프론트엔드 JS에서 사용되는 공개 키이므로 인증 불필요)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('key_value')
      .eq('key_name', 'naver_map_client_id')
      .single();

    if (error || !data?.key_value) {
      return NextResponse.json({ clientId: null });
    }

    return NextResponse.json({ clientId: data.key_value });
  } catch {
    return NextResponse.json({ clientId: null });
  }
}
