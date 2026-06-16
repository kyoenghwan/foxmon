import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 서버 사이드 Geocoding API 엔드포인트
// 주소를 좌표(위도/경도)로 변환 - Naver Geocoding API는 서버에서만 호출 가능 (CORS)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ lat: null, lng: null, error: 'query required' });
  }

  try {
    // DB에서 Client ID & Secret 가져오기
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('key_name, key_value')
      .in('key_name', ['naver_map_client_id', 'naver_map_client_secret']);

    const clientId = settings?.find(s => s.key_name === 'naver_map_client_id')?.key_value;
    const clientSecret = settings?.find(s => s.key_name === 'naver_map_client_secret')?.key_value;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ lat: null, lng: null, error: 'API keys not configured' });
    }

    // Naver Geocoding API 호출 (서버 사이드)
    const res = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
      }
    );

    const data = await res.json();

    if (data.status === 'OK' && data.addresses?.length > 0) {
      const { y: lat, x: lng } = data.addresses[0];
      return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }

    return NextResponse.json({ lat: null, lng: null, error: 'No results' });
  } catch (err: any) {
    console.error('Geocoding error:', err);
    return NextResponse.json({ lat: null, lng: null, error: err.message });
  }
}
