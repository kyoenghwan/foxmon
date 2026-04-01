import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseEnabled = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('kgwvftaebjkjwwpsftqv.supabase.co') === false;
// 위 조건은 나중에 실제 URL 검증으로 고도화 가능
