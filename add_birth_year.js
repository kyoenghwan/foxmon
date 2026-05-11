const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumn() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: 'ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS birth_year INTEGER;'
  });
  console.log(data, error);
}

addColumn();
