const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultiAlias(userId) {
    const rawUserId = userId.trim();
    const normalizedUserId = rawUserId.toLowerCase();

    const userIdsToMatch = [rawUserId, normalizedUserId];
    const { data: userData } = await supabase
        .from('users')
        .select('id, login_id, nickname')
        .or(`id.eq.${rawUserId},login_id.eq.${rawUserId},login_id.eq.${normalizedUserId}`)
        .maybeSingle();

    if (userData) {
        if (userData.id) userIdsToMatch.push(userData.id);
        if (userData.login_id) userIdsToMatch.push(userData.login_id);
        if (userData.nickname) userIdsToMatch.push(userData.nickname);
    }

    const uniqueUserIds = Array.from(new Set(userIdsToMatch.filter(Boolean)));
    const orConditions = uniqueUserIds.map(id => `session_id.eq.${id}`).join(',');

    const { data: participants } = await supabase
        .from('foxtalk_participants')
        .select(`
            id,
            room_id,
            last_read_at,
            foxtalk_rooms!inner(
                id,
                type,
                last_message_at
            )
        `)
        .or(orConditions);

    let foxTalkUnread = 0;
    let csUnread = 0;

    (participants || []).forEach((p) => {
        const room = p.foxtalk_rooms;
        if (!room || !room.last_message_at) return;

        const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
        const lastMsgTime = new Date(room.last_message_at).getTime();

        if (lastMsgTime > lastReadTime + 1000) {
            if (room.type === 'CS') {
                csUnread += 1;
            } else {
                foxTalkUnread += 1;
            }
        }
    });

    return { foxTalkUnread, csUnread, totalUnread: foxTalkUnread + csUnread };
}

async function run() {
    console.log("Result with '872fa168-e834-4f7b-8a7e-e8c1c73955b0':", await testMultiAlias('872fa168-e834-4f7b-8a7e-e8c1c73955b0'));
    console.log("Result with 'test1':", await testMultiAlias('test1'));
}

run();
