import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { FA_RECORD_AND_GET_VISITORS } from '@/src/atoms/fa/visitor/FA_RECORD_AND_GET_VISITORS';

export async function GET() {
  try {
    const headersList = await headers();
    
    // 다양한 프록시 환경의 IP 전달 헤더 대응
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    
    let ipAddress = '127.0.0.1';
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ipAddress = realIp.trim();
    }
    
    // 로컬 환경 루프백 IP 표준화
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1';
    }

    const result = await FA_RECORD_AND_GET_VISITORS({ ipAddress });

    if (!result.success) {
      return NextResponse.json({ success: false, count: 0 }, { status: 550 });
    }

    return NextResponse.json({ success: true, count: result.data });
  } catch (error) {
    return NextResponse.json({ success: false, count: 0 }, { status: 550 });
  }
}
