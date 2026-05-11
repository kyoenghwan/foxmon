import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface UpsertPolicyParams {
  policy_type: string;
  title: string;
  content: string;
  is_required?: boolean;
}

export async function OA_UPSERT_POLICY(input: UpsertPolicyParams): Promise<{ success: boolean; data: any; error: string | null }> {
  nvLog('AT', '▶️ OA_UPSERT_POLICY 시작', { policyType: input.policy_type });
  
  try {
    const payload = {
      policy_type: input.policy_type,
      title: input.title,
      content: input.content,
      is_required: input.is_required ?? true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('system_policies')
      .upsert(payload, { onConflict: 'policy_type' })
      .select()
      .single();
      
    if (error) {
      nvLog('AT', '❌ OA_UPSERT_POLICY 에러', error.message);
      return { success: false, data: null, error: error.message };
    }
    
    return { success: true, data, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ OA_UPSERT_POLICY 시스템 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
