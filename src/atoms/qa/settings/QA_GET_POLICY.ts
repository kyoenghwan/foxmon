import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_POLICY(policyType: string): Promise<{ success: boolean; data: any; error: string | null }> {
  nvLog('AT', '▶️ QA_GET_POLICY 시작', { policyType });
  
  try {
    const { data, error } = await supabase
      .from('system_policies')
      .select('*')
      .eq('policy_type', policyType)
      .maybeSingle();
      
    if (error) {
      nvLog('AT', '❌ QA_GET_POLICY 에러', error.message);
      return { success: false, data: null, error: error.message };
    }
    
    return { success: true, data, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_POLICY 시스템 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
