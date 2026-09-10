const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllMsgs() {
    const test1SessionId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
    const roomIds = [
        'e7cab5bf-6323-4577-8c3d-bd3fc3620e94',
        '650d5660-46ec-4dc1-8f59-35b4e0bfd961',
        'c07237fa-793e-4c1a-9abe-d6d6c036b21d',
        '173cfdb3-b652-4f9a-8694-28a474383d3f'
    ];

    for (const rid of roomIds) {
        console.log(`\n=================== Room ${rid} ===================`);
        const { data: pList } = await supabase.from('foxtalk_participants').select('*').eq('room_id', rid);
        console.log("Participants:");
        pList.forEach(p => console.log(`  PartID: ${p.id}, SessionID: ${p.session_id}, Nick: ${p.nickname}, LastReadAt: ${p.last_read_at}`));

        const myPart = pList.find(p => p.session_id === test1SessionId);
        const lastRead = myPart ? myPart.last_read_at : '1970-01-01';

        const { data: msgs } = await supabase.from('foxtalk_messages').select('*').eq('room_id', rid).order('created_at', { ascending: false }).limit(5);
        console.log("Latest Messages:");
        msgs.forEach(m => {
            const isAfter = new Date(m.created_at) > new Date(lastRead);
            const isFromMe = myPart && m.participant_id === myPart.id;
            console.log(`  MsgID: ${m.id}, Content: "${m.content}", SenderPartID: ${m.participant_id}, CreatedAt: ${m.created_at} (IsAfterLastRead: ${isAfter}, IsFromMe: ${isFromMe})`);
        });
    }
}

checkAllMsgs();
