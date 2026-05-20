"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramMessageDirect } from '@/lib/telegram';
import { OA_INSERT_CHAT_PARTICIPANT } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT';
import { QA_GET_CS_SETTINGS } from '@/src/atoms/qa/support/QA_GET_CS_SETTINGS';
import { isWithinBusinessHours } from '@/lib/cs-settings';
import { shouldSendCsAutoReply } from '@/lib/cs-auto-reply';
import { matchCsAutomationReply, parseCsAutomationRules } from '@/lib/cs-automation';

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
        .maybeSingle();
    const fromSettings = data?.key_value?.trim();
    if (fromSettings) return fromSettings;

    const { data: fallback } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('login_id', 'foxmon_cs')
        .maybeSingle();
    return fallback?.id?.trim() || null;
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

async function insertCsTextAsAdmin(roomId: string, adminUserId: string, content: string) {
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
            content,
            message_type: 'TEXT',
        },
    ]);

    await supabaseAdmin
        .from('foxtalk_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);
}

async function insertCsAutoReply(roomId: string, adminUserId: string) {
    const settingsRes = await QA_GET_CS_SETTINGS();
    const settings = settingsRes.data;
    const inHours = isWithinBusinessHours(settings);
    const content = inHours ? settings.messageInHours : settings.messageAfterHours;
    await insertCsTextAsAdmin(roomId, adminUserId, content);
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

        if (isCustomerText && adminUUID && actualParticipantId) {
            const settingsRes = await QA_GET_CS_SETTINGS();
            const settings = settingsRes.data;

            const { count: customerTextCount } = await supabaseAdmin
                .from('foxtalk_messages')
                .select('id', { count: 'exact', head: true })
                .eq('room_id', data.room_id)
                .eq('participant_id', actualParticipantId)
                .eq('message_type', 'TEXT');

            const { data: recentMsgs } = await supabaseAdmin
                .from('foxtalk_messages')
                .select('id, participant_id, content, message_type')
                .eq('room_id', data.room_id)
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: csParts } = await supabaseAdmin
                .from('foxtalk_participants')
                .select('id')
                .eq('room_id', data.room_id)
                .eq('session_id', adminUUID);

            const csParticipantIds = (csParts || []).map((p) => p.id).filter(Boolean) as string[];

            const sendAuto = shouldSendCsAutoReply({
                settings,
                customerTextCount: customerTextCount ?? 0,
                recentMessagesNewestFirst: recentMsgs || [],
                csParticipantIds,
            });

            if (sendAuto) {
                await insertCsAutoReply(data.room_id, adminUUID);
            }

            if (settings.automationEnabled) {
                const rules = parseCsAutomationRules(settings.automationRulesJson);
                const botReply = matchCsAutomationReply(data.content, rules);
                if (botReply) {
                    const { data: recentAfter } = await supabaseAdmin
                        .from('foxtalk_messages')
                        .select('id, participant_id, content, message_type')
                        .eq('room_id', data.room_id)
                        .order('created_at', { ascending: false })
                        .limit(3);
                    const csIdSet = new Set(csParticipantIds);
                    const lastBot =
                        recentAfter?.[0]?.participant_id &&
                        csIdSet.has(recentAfter[0].participant_id) &&
                        recentAfter[0].content?.trim() === botReply.trim();
                    if (!lastBot) {
                        await insertCsTextAsAdmin(data.room_id, adminUUID, botReply);
                    }
                }
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
