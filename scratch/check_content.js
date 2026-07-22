const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const realAnon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, realAnon);

async function run() {
    const { data, error } = await supabase
        .from('biz_ads')
        .select('*')
        .eq('id', '9a2ffd34-f767-4076-bb5b-5f7de08338d4')
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("=== 검색 결과 ===");
    console.log("ID:", data.id);
    console.log("Title:", data.title);
    console.log("Detail Content Length:", data.detail_content?.length);
    console.log("Detail Content starts with:", data.detail_content?.substring(0, 100));
    console.log("Detail Content ends with:", data.detail_content?.substring(data.detail_content.length - 100));
    console.log("Design Mode:", data.design_mode);
}

run();
