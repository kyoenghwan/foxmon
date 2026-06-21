const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function getFuncSource() {
    const sql = `
        SELECT pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        WHERE p.proname = 'initialize_retro_board_round';
    `;
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error("Error getting function source:", error);
    } else {
        console.log("Function Source Raw:", data);
        let list = data;
        if (typeof data === 'string') {
            try {
                list = JSON.parse(data);
            } catch(e) {}
        }
        if (Array.isArray(list) && list.length > 0) {
            console.log("Function Definition:\n", list[0].def);
        } else {
            console.log("Parsed Data:", list);
        }
    }
}

getFuncSource();
