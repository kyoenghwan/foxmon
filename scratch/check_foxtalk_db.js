const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("=== my_participant 조인 분리 쿼리 최적화 테스트 ===");
    const testSessionId = "b5e647ff-e8be-4502-ac30-06a2998cf7ef";

    const tStart = Date.now();
    
    // 1. 방 정보 조회 (my_participant 조인 제거)
    let query = supabase
        .from('foxtalk_rooms')
        .select(`
            *,
            employer:employer_id(id, login_id, nickname, name, business_name),
            seeker:seeker_id(id, login_id, nickname, name)
        `)
        .eq('is_active', true);

    // 일반 구직자 필터링
    if (testSessionId) {
        query = query.or(`type.in.(OPEN,SECRET),and(type.eq.1ON1,seeker_id.eq.${testSessionId})`);
    } else {
        query = query.in('type', ['OPEN', 'SECRET']);
    }

    query = query
        .order('created_at', { ascending: false })
        .limit(100);

    const { data: rooms, error: roomsError } = await query;
    const tRooms = Date.now();
    console.log(`[1] rooms 조회 완료: ${tRooms - tStart}ms, 개수: ${rooms?.length || 0}`, roomsError || "");

    if (!rooms || rooms.length === 0) return;

    const roomIds = rooms.map(r => r.id);

    // 1-2. 내 참가 정보 개별 조회 (조인 분리)
    const tPartStart = Date.now();
    let myParticipants = [];
    if (testSessionId) {
        const { data: parts, error: partError } = await supabase
            .from('foxtalk_participants')
            .select('id, room_id, last_read_at, session_id')
            .in('room_id', roomIds)
            .eq('session_id', testSessionId);
        if (partError) console.error("참가 정보 조회 에러:", partError);
        myParticipants = parts || [];
    }
    const tPartEnd = Date.now();
    console.log(`[1-2] 내 참가 정보 조회 완료: ${tPartEnd - tPartStart}ms, 개수: ${myParticipants.length}`);

    // 2. 메시지 일괄 조회 (in 쿼리 1회) -> 각 방의 최신 메시지 매핑용
    const tMsgStart = Date.now();
    const { data: allMessages, error: msgError } = await supabase
        .from('foxtalk_messages')
        .select('room_id, content, created_at, participant_id')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });
    const tMsgEnd = Date.now();
    console.log(`[2] 메시지 일괄 조회 완료: ${tMsgEnd - tMsgStart}ms, 개수: ${allMessages?.length || 0}`, msgError || "");

    // 3. 안읽은 메시지 일괄 조회 (or 쿼리 1회)
    const tUnreadStart = Date.now();
    let unreadCountMap = {};
    if (testSessionId && myParticipants.length > 0) {
        const orConditions = myParticipants.map(p => {
            const lastRead = p.last_read_at || '1970-01-01T00:00:00.000Z';
            return `and(room_id.eq.${p.room_id},created_at.gt.${lastRead},participant_id.neq.${p.id})`;
        }).join(',');

        const { data: msgs, error: unreadError } = await supabase
            .from('foxtalk_messages')
            .select('room_id')
            .or(orConditions);
        
        if (msgs) {
            msgs.forEach(m => {
                unreadCountMap[m.room_id] = (unreadCountMap[m.room_id] || 0) + 1;
            });
        }
        console.log(`[3] 안읽은 메시지 일괄 조회 완료: ${Date.now() - tUnreadStart}ms, 개수: ${msgs?.length || 0}`, unreadError || "");
    }

    const tEnd = Date.now();
    console.log(`=== 전체 쿼리 소요 시간: ${tEnd - tStart}ms ===`);
}

test();
