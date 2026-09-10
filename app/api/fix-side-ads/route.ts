import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireMaintenanceAdmin } from '@/lib/api-authorization';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ success: false, error: 'POST 요청이 필요합니다.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function POST(request: Request) {
  const denied = await requireMaintenanceAdmin(request);
  if (denied) return denied;
  try {
    const { data, error } = await supabaseAdmin
      .from('biz_ads')
      .update({ 
        expires_at: '2026-12-31T23:59:59.999Z', 
        status: 'ACTIVE' 
      })
      .eq('tier', 'SIDE')
      .select('id, title, tier, status, expires_at');

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
