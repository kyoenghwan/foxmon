import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// 서버 사이드 Geocoding API 엔드포인트
// 주소를 좌표(위도/경도)로 변환 - Naver Geocoding API는 서버에서만 호출 가능 (CORS)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  nvLog('AT', `[Geocoding API] GET 요청 수신 - query: "${query}"`);

  if (!query) {
    nvLog('AT', `[Geocoding API] 경고 - query 파라미터 누락`);
    return NextResponse.json({ lat: null, lng: null, error: 'query required' });
  }

  try {
    // DB에서 Client ID & Secret 가져오기
    nvLog('AT', `[Geocoding API] Supabase에서 네이버 지도 API 설정 조회 중...`);
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('key_name, key_value')
      .in('key_name', ['naver_map_client_id', 'naver_map_client_secret']);

    const clientId = settings?.find(s => s.key_name === 'naver_map_client_id')?.key_value;
    const clientSecret = settings?.find(s => s.key_name === 'naver_map_client_secret')?.key_value;

    nvLog('AT', `[Geocoding API] Supabase 설정 조회 완료`, {
      clientId: clientId ? `${clientId.slice(0, 4)}***` : '없음',
      clientSecret: clientSecret ? `${clientSecret.slice(0, 4)}***` : '없음'
    });

    if (!clientId || !clientSecret) {
      nvLog('AT', `[Geocoding API] 에러 - API 키 설정 부족`);
      return NextResponse.json({ lat: null, lng: null, error: 'API keys not configured' });
    }

    // Naver Geocoding API 호출 (서버 사이드) - PDF 가이드에 기재된 도메인 및 헤더로 수정
    const targetUrl = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    nvLog('AT', `[Geocoding API] NCP API 게이트웨이 호출 시작: ${targetUrl}`);

    const res = await fetch(
      targetUrl,
      {
        headers: {
          'x-ncp-apigw-api-key-id': clientId,
          'x-ncp-apigw-api-key': clientSecret,
          'Accept': 'application/json',
        },
      }
    );

    nvLog('AT', `[Geocoding API] NCP 응답 수신 - HTTP Status: ${res.status}`);
    const data = await res.json();

    if (res.status !== 200) {
      nvLog('AT', `[Geocoding API] 에러 - NCP API 호출 실패 (HTTP ${res.status})`, data);
      return NextResponse.json({ lat: null, lng: null, error: `NCP error: ${res.status}`, detail: data });
    }

    nvLog('AT', `[Geocoding API] NCP 응답 파싱 완료`, data);

    if (data.status === 'OK' && data.addresses?.length > 0) {
      const { y: lat, x: lng } = data.addresses[0];
      nvLog('AT', `[Geocoding API] 성공 - 좌표 변환 완료: lat=${lat}, lng=${lng}`);
      return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }

    nvLog('AT', `[Geocoding API] 경고 - 검색된 주소 목록이 비어있음`);
    return NextResponse.json({ lat: null, lng: null, error: 'No results' });
  } catch (err: any) {
    nvLog('AT', `[Geocoding API] 에러 - 처리 중 예외 발생`, err);
    return NextResponse.json({ lat: null, lng: null, error: err.message });
  }
}
