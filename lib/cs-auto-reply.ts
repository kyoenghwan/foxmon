import type { CsSettings } from '@/lib/cs-settings';
import { isWithinBusinessHours } from '@/lib/cs-settings';

export type CsMessageRow = {
  id: string;
  participant_id: string | null;
  content: string;
  message_type?: string;
};

/**
 * 고객 TEXT 메시지 저장 직후 자동 안내를 보낼지 판단
 * - 업무시간 중: 해당 고객의 첫 TEXT 1회
 * - 업무시간 외: 휴무 안내가 직전에 없으면 발송 (추가 문의 시에도 안내)
 */
export function shouldSendCsAutoReply(params: {
  settings: CsSettings;
  customerTextCount: number;
  recentMessagesNewestFirst: CsMessageRow[];
  csParticipantIds: string[];
}): boolean {
  const { settings, customerTextCount, recentMessagesNewestFirst, csParticipantIds } = params;
  const inHours = isWithinBusinessHours(settings);

  if (inHours) {
    return customerTextCount === 1;
  }

  const csIdSet = new Set(csParticipantIds.filter(Boolean));
  const prev = recentMessagesNewestFirst.slice(1);

  if (!prev.length) {
    return customerTextCount >= 1;
  }

  const lastPrev = prev[0];
  const lastWasAfterHoursAck =
    !!lastPrev.participant_id &&
    csIdSet.has(lastPrev.participant_id) &&
    lastPrev.content.trim() === settings.messageAfterHours.trim();

  return !lastWasAfterHoursAck;
}
