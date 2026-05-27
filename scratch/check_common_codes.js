require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Anon key is missing in env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCodes() {
    try {
        console.log("Fetching common codes from table 'common_codes'...");
        const { data, error } = await supabase
            .from('common_codes')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error("Supabase Query Error:", error);
            return;
        }

        console.log(`Total active codes fetched: ${data.length}`);
        
        const salaryTypes = data.filter(c => c.list_type === 'SALARY_TYPE');
        console.log(`\n--- SALARY_TYPE items (${salaryTypes.length}) ---`);
        salaryTypes.forEach(c => {
            console.log(`- ${c.code_name} (Value: ${c.code_value}, Parent: ${c.parent_code_value})`);
        });

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

checkCodes();
