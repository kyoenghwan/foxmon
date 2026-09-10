const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function inspectBizAds() {
    const { data, error } = await supabase.from('biz_ads').select('*');
    if (error) {
      console.error(error);
      return;
    }
    console.log('=== biz_ads ALL RECORDS ===');
    console.table(data.map(r => ({
      id: r.id,
      title: r.title?.slice(0, 20),
      tier: r.tier,
      ad_type: r.ad_type,
      status: r.status,
      expires_at: r.expires_at
    })));
}
inspectBizAds();
