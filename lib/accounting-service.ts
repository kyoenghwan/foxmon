'use server';

import { supabaseAdmin } from './supabase';

export interface AccountingRecord {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description: string;
    transaction_date: string;
    created_at: string;
}

export async function getAccountingRecords(month?: string): Promise<AccountingRecord[]> {
    let query = supabaseAdmin
        .from('accounting_records')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (month) {
        // month format: YYYY-MM
        const startDate = `${month}-01`;
        const endDate = `${month}-31`; // Basic handling, valid date ranges can be strict
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching accounting records:', error);
        return [];
    }

    return data as AccountingRecord[];
}

export async function addAccountingRecord(data: Omit<AccountingRecord, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('accounting_records')
        .insert([data]);

    if (error) {
        console.error('Error adding accounting record:', error);
        return false;
    }

    return true;
}

export async function deleteAccountingRecord(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('accounting_records')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting accounting record:', error);
        return false;
    }

    return true;
}
