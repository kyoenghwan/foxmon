import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        envKeys: Object.keys(process.env),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
}
