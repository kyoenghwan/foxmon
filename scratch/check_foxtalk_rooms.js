const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRooms() {
  console.log("=== foxtalk_rooms 조회 ===");
  const { data: rooms, error } = await supabase
    .from('foxtalk_rooms')
    .select(`
      *,
      employer:employer_id(id, login_id, nickname, name, business_name),
      seeker:seeker_id(id, login_id, nickname, name)
    `)
    .limit(10);

  if (error) {
    console.error("조회 에러:", error);
    return;
  }

  console.log(`조회된 방 개수: ${rooms.length}`);
  rooms.forEach(r => {
    console.log(`\n방 ID: ${r.id}`);
    console.log(`제목 (DB title): ${r.title}`);
    console.log(`타입: ${r.type}`);
    console.log(`구인자 (employer_id): ${r.employer_id}`);
    console.log(`구인자 조인 정보:`, r.employer);
    console.log(`구직자 (seeker_id): ${r.seeker_id}`);
    console.log(`구직자 조인 정보:`, r.seeker);
  });
}

checkRooms();
