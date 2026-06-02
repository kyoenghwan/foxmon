import { NextResponse } from 'next/server';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { nvLog } from '@/lib/logger';

export async function GET() {
  const proxyUrl = process.env.FIXIE_URL;
  const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  try {
    const client = axios.create({
      httpsAgent,
      proxy: false,
      timeout: 5000
    });

    nvLog('FW', '🔍 프록시 아웃바운드 IP 테스트 시작');
    const response = await client.get('https://api.ipify.org?format=json');
    const ip = response.data.ip;

    return NextResponse.json({
      success: true,
      message: 'Vercel 백엔드 서버에서 발송한 외부 통신 공인 IP 확인 성공',
      fixie_enabled: !!proxyUrl,
      outbound_ip: ip,
      expected_ips: ['52.5.155.132', '52.87.82.133'],
      status: ['52.5.155.132', '52.87.82.133'].includes(ip) ? '정상 작동 (고정 IP 완벽 적용됨)' : '프록시 미작동 (Vercel 기본 동적 IP)'
    });
  } catch (error: any) {
    nvLog('FW', '❌ 프록시 아웃바운드 IP 테스트 에러', error.message);
    return NextResponse.json({
      success: false,
      message: '아웃바운드 IP 조회 실패',
      error: error.message
    }, { status: 500 });
  }
}
