"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { CS_SETTING_KEYS, parseCsSettings, type CsSettings } from '@/lib/cs-settings';

export async function QA_GET_CS_SETTINGS(): Promise<{ success: boolean; data: CsSettings }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('key_name, key_value')
      .in('key_name', [...CS_SETTING_KEYS]);

    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data || []) {
      map[row.key_name] = row.key_value ?? '';
    }

    return { success: true, data: parseCsSettings(map) };
  } catch (err: unknown) {
    console.error('QA_GET_CS_SETTINGS Error:', err);
    return { success: true, data: parseCsSettings(null) };
  }
}
