import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// RLS 정책을 무시하고 강제로 DB를 수정할 수 있는 관리자 권한 클라이언트 (서버 액션 전용)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const isSupabaseEnabled = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('kgwvftaebjkjwwpsftqv.supabase.co') === false;
// 위 조건은 나중에 실제 URL 검증으로 고도화 가능
