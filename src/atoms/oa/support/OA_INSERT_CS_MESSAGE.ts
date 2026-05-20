"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramMessageDirect } from '@/lib/telegram';
import { OA_INSERT_CHAT_PARTICIPANT } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT';

interface CSMessageData {
    room_id: string;
    participant_id?: string;
    content: string;
    message_type?: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_LEAVE' | 'SYSTEM_ALERT';
    sender_nickname?: string;
}

async function getCsAdminUserId(): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from('site_settings')
        .select('key_value')
        .eq('key_name', 'cs_admin_user_id')
        .single();
    return data?.key_value?.trim() || null;
}

async function resolveParticipantId(
    roomId: string,
    sessionId: string,
    senderNickname?: string
): Promise<string | null> {
    const { data: existing } = await supabaseAdmin
        .from('foxtalk_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('session_id', sessionId)
        .maybeSingle();

    if (existing?.id) return existing.id;

    await OA_INSERT_CHAT_PARTICIPANT({
        room_id: roomId,
        session_id: sessionId,
        nickname: senderNickname || '고객',
        avatar_type: 'fox1',
    });

    const { data: created } = await supabaseAdmin
        .from('foxtalk_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('session_id', sessionId)
        .maybeSingle();

    return created?.id || null;
}

async function insertCsAutoReply(roomId: string, adminUserId: string) {
    await OA_INSERT_CHAT_PARTICIPANT({
        room_id: roomId,
        session_id: adminUserId,
        nickname: '폭스몬 고객센터',
        avatar_type: 'fox1',
    });

    const { data: csParticipant } = await supabaseAdmin
        .from('foxtalk_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('session_id', adminUserId)
        .maybeSingle();

    if (!csParticipant?.id) return;

    await supabaseAdmin.from('foxtalk_messages').insert([
        {
            room_id: roomId,
            participant_id: csParticipant.id,
            content:
                '문의해 주셔서 감사합니다. 담당자가 확인 후 순서대로 답변드리겠습니다. 잠시만 기다려 주세요.',
            message_type: 'TEXT',
        },
    ]);
}

export const OA_INSERT_CS_MESSAGE = async (data: CSMessageData) => {
    try {
        let actualParticipantId: string | null = null;
        const adminUUID = await getCsAdminUserId();

        if (data.participant_id && data.participant_id !== 'CS_ADMIN') {
            actualParticipantId = await resolveParticipantId(
                data.room_id,
                data.participant_id,
                data.sender_nickname
            );
        }

        const { data: message, error } = await supabaseAdmin
            .from('foxtalk_messages')
            .insert([
                {
                    room_id: data.room_id,
                    participant_id: actualParticipantId,
                    content: data.content,
                    message_type: data.message_type || 'TEXT',
                },
            ])
            .select()
            .single();

        if (error) throw error;

        await supabaseAdmin
            .from('foxtalk_rooms')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', data.room_id);

        const isCustomerText =
            data.message_type !== 'SYSTEM_JOIN' &&
            data.message_type !== 'SYSTEM_LEAVE' &&
            data.message_type !== 'SYSTEM_ALERT' &&
            (data.message_type || 'TEXT') === 'TEXT' &&
            !!data.participant_id &&
            data.participant_id !== 'CS_ADMIN' &&
            data.participant_id !== adminUUID;

        // 고객 첫 문의 1회만 자동 접수 안내 (매 메시지마다 반복 방지)
        if (isCustomerText && adminUUID && actualParticipantId) {
            const { count } = await supabaseAdmin
                .from('foxtalk_messages')
                .select('id', { count: 'exact', head: true })
                .eq('room_id', data.room_id)
                .eq('participant_id', actualParticipantId)
                .eq('message_type', 'TEXT');

            if (count === 1) {
                await insertCsAutoReply(data.room_id, adminUUID);
            }
        }

        if (isCustomerText) {
            const { data: tgSetting } = await supabaseAdmin
                .from('site_settings')
                .select('key_value')
                .eq('key_name', 'cs_telegram_chat_id')
                .single();

            const adminChatId = tgSetting?.key_value?.trim();
            if (adminChatId) {
                const tgMsg = `🎧 <b>[고객센터 문의 도착]</b>\n👤 <b>${data.sender_nickname || '익명'}</b>\n\n"${data.content}"\n\n👉 관리자 고객센터 메신저에서 답변해 주세요.\nhttps://foxmon.co.kr/fox-office/support/inbox`;
                await sendTelegramMessageDirect(adminChatId, tgMsg);
            }
        }

        return { success: true, data: message };
    } catch (error: unknown) {
        console.error('OA_INSERT_CS_MESSAGE Error:', error);
        return { success: false, error: '메시지 전송에 실패했습니다.' };
    }
};
