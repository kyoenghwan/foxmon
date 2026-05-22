"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramAlert } from '@/lib/telegram';

export interface ChatRoomData {
    title: string;
    type: 'OPEN' | 'SECRET' | '1ON1';
    room_code?: string;
    password_hash?: string;
    max_participants: number;
    created_by: string;
    job_id?: string;
    employer_id?: string;
    seeker_id?: string;
}

export const OA_INSERT_CHAT_ROOM = async (data: ChatRoomData) => {
    try {
        // 1:1 방의 경우, 이미 존재하는 방이 있는지 먼저 확인하여 중복 생성을 방지합니다.
        if (data.type === '1ON1' && data.seeker_id && data.employer_id) {
            const { data: existingRoom } = await supabaseAdmin
                .from('foxtalk_rooms')
                .select('*')
                .eq('type', '1ON1')
                .eq('seeker_id', data.seeker_id)
                .eq('employer_id', data.employer_id)
                .eq('title', data.title)
                .single();

            if (existingRoom) {
                // 이미 존재하는 방이 있으면 기존 방을 반환 (이 경우 텔레그램 알림은 중복 발송하지 않음)
                return { success: true, data: existingRoom };
            }
        }

        let result = await supabaseAdmin
            .from('foxtalk_rooms')
            .insert([{
                title: data.title,
                type: data.type,
                room_code: data.room_code || null,
                password_hash: data.password_hash || null,
                max_participants: data.max_participants,
                created_by: data.created_by,
                is_active: true,
                job_id: data.job_id || null,
                employer_id: data.employer_id || null,
                seeker_id: data.seeker_id || null
            }])
            .select()
            .single();

        // 1차 시도에서 외래키 오류 발생 시 처리
        if (result.error && result.error.message.includes('violates foreign key constraint')) {
            const isJobIdError = result.error.message.includes('job_id');
            const isEmployerIdError = result.error.message.includes('employer_id');
            
            console.warn('Foreign key violation detected in foxtalk_rooms. Retrying...', result.error.message);
            result = await supabaseAdmin
                .from('foxtalk_rooms')
                .insert([{
                    title: data.title,
                    type: data.type,
                    room_code: data.room_code || null,
                    password_hash: data.password_hash || null,
                    max_participants: data.max_participants,
                    created_by: data.created_by,
                    is_active: true,
                    job_id: isJobIdError ? null : (data.job_id || null),
                    employer_id: isEmployerIdError ? null : (data.employer_id || null),
                    seeker_id: data.seeker_id || null
                }])
                .select()
                .single();
        }

        if (result.error) throw result.error;
        const room = result.data;

        // 1:1 방 생성 시 참여자 2명 자동 등록 (안읽음 카운팅 등을 위해 참여자 레코드 선행 생성 필수)
        if (data.type === '1ON1' && data.employer_id && data.seeker_id) {
            try {
                // 1. 업체 정보 조회
                const { data: employerUser } = await supabaseAdmin
                    .from('users')
                    .select('nickname, business_name')
                    .eq('id', data.employer_id)
                    .single();

                // 2. 구직자 정보 조회
                const { data: seekerUser } = await supabaseAdmin
                    .from('users')
                    .select('nickname')
                    .eq('id', data.seeker_id)
                    .single();

                const employerNick = employerUser?.business_name || employerUser?.nickname || '업체';
                const seekerNick = seekerUser?.nickname || '구직자';

                // 두 참여자 insert (upsert 활용하여 중복 삽입 에러 방지)
                await supabaseAdmin
                    .from('foxtalk_participants')
                    .upsert([
                        {
                            room_id: room.id,
                            session_id: data.employer_id,
                            nickname: employerNick,
                            avatar_type: 'fox1',
                            joined_at: new Date().toISOString()
                        },
                        {
                            room_id: room.id,
                            session_id: data.seeker_id,
                            nickname: seekerNick,
                            avatar_type: 'fox2',
                            joined_at: new Date().toISOString()
                        }
                    ], { onConflict: 'room_id, session_id' });
            } catch (participantErr) {
                console.error("1ON1 방 참여자 자동 등록 중 오류:", participantErr);
            }
        }

        // 1:1 방 생성 시 사장님에게 텔레그램 알림 전송
        if (data.type === '1ON1' && data.employer_id && data.seeker_id) {
            try {
                // 지원자 기본 정보 조회
                const { data: seeker } = await supabaseAdmin
                    .from('users')
                    .select('nickname, birth_year, gender')
                    .eq('id', data.seeker_id)
                    .single();

                // 이력서 기본 정보 조회 (가장 최근 1개)
                const { data: resume } = await supabaseAdmin
                    .from('resumes')
                    .select('desired_location, desired_job_type, height, weight')
                    .eq('user_id', data.seeker_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const nickname = seeker?.nickname || '익명 지원자';
                let basicInfo = '';
                
                if (seeker) {
                    const currentYear = new Date().getFullYear();
                    const age = seeker.birth_year ? currentYear - parseInt(seeker.birth_year) : '나이 미상';
                    const genderStr = seeker.gender === 'F' ? '여' : (seeker.gender === 'M' ? '남' : '');
                    basicInfo += `\n👤 <b>지원자:</b> ${nickname} ${genderStr ? `(${genderStr}, ${age}세)` : `(${age}세)`}`;
                }
                if (resume) {
                    if (resume.desired_location) basicInfo += `\n📍 <b>희망지역:</b> ${resume.desired_location}`;
                    if (resume.desired_job_type) basicInfo += `\n💼 <b>희망업종:</b> ${resume.desired_job_type}`;
                    if (resume.height || resume.weight) basicInfo += `\n📏 <b>체형:</b> ${resume.height ? resume.height + 'cm' : '?'} / ${resume.weight ? resume.weight + 'kg' : '?'}`;
                }

                const hiddenLink = `<a href="https://foxmon.co.kr/room/${room.id}">&#8203;</a>`;
                const tgMsg = `🔔 <b>[폭스몬] 새로운 지원자가 연락했습니다!</b>\n\n💬 <b>${nickname}</b> 님이 <b>[${data.title}]</b> 구인글을 통해 FoxTalk 메시지를 시작했습니다.\n${basicInfo ? '\n--- 지원자 요약 ---' + basicInfo + '\n------------------\n' : '\n'}💡 이 메시지에 <b>[답장(Reply)]</b> 기능을 사용하여 메시지를 작성하면 상대방에게 바로 전달됩니다!${hiddenLink}`;

                await sendTelegramAlert(data.employer_id, tgMsg);
            } catch (err) {
                console.error("텔레그램 알림 발송 중 오류:", err);
            }
        }

        return { success: true, data: room };
    } catch (error: any) {
        console.error('OA_INSERT_CHAT_ROOM Error (Detailed):', error?.message || error);
        return { success: false, error: error?.message || '채팅방 생성에 실패했습니다.' };
    }
};
