const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function check() {
    const res1 = await supabase.from('jobs').select('*').limit(1);
    console.log('JOBS:', Object.keys(res1.data?.[0] || {}));
    const res2 = await supabase.from('ads').select('*').limit(1);
    console.log('ADS:', Object.keys(res2.data?.[0] || {}));
}
check();
