-- Create accounting_records table
CREATE TABLE IF NOT EXISTS public.accounting_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add index for efficient querying by month/type
CREATE INDEX IF NOT EXISTS idx_accounting_date ON public.accounting_records(transaction_date);
CREATE INDEX IF NOT EXISTS idx_accounting_type ON public.accounting_records(type);

-- Setup RLS
ALTER TABLE public.accounting_records ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage accounting records
CREATE POLICY "Admins can view all accounting records"
    ON public.accounting_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can insert accounting records"
    ON public.accounting_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update accounting records"
    ON public.accounting_records
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete accounting records"
    ON public.accounting_records
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ADMIN'
        )
    );
