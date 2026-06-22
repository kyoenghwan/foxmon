import { NextResponse } from 'next/server';

// Vercel Cron Job에 의해 5분마다 호출되어 서버리스 함수를 웜 상태로 유지
export async function GET() {
    return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
