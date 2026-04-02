import { nvLog } from '../../../../lib/logger';
import { QA_GET_CHAT_ROOMS } from '../../qa/foxtalk/QA_GET_CHAT_ROOMS';
import { QA_GET_CHAT_MESSAGES } from '../../qa/foxtalk/QA_GET_CHAT_MESSAGES';
import { OA_INSERT_CHAT_ROOM } from '../../oa/foxtalk/OA_INSERT_CHAT_ROOM';
import { OA_INSERT_CHAT_MESSAGE } from '../../oa/foxtalk/OA_INSERT_CHAT_MESSAGE';

export async function FA_MANAGE_FOXTALK_FLOW(
  actionType: 'GET_ROOMS' | 'GET_MESSAGES' | 'CREATE_ROOM' | 'SEND_MESSAGE',
  payload?: any
) {
  nvLog('AT', `▶️ FA_MANAGE_FOXTALK_FLOW 시작 [${actionType}]`, payload);

  try {
    if (actionType === 'GET_ROOMS') {
      const result = await QA_GET_CHAT_ROOMS();
      return { success: result.success, data: result.data, message: result.error || '방 목록 조회 완료' };
    }

    if (actionType === 'GET_MESSAGES') {
      if (!payload?.roomId) return { success: false, message: '방 ID 누락' };
      const result = await QA_GET_CHAT_MESSAGES(payload.roomId);
      return { success: result.success, data: result.data, message: result.error || '메시지 로드 완료' };
    }

    if (actionType === 'CREATE_ROOM') {
      const result = await OA_INSERT_CHAT_ROOM(payload);
      return { success: result.success, data: result.data, message: result.error || '방 생성 완료' };
    }

    if (actionType === 'SEND_MESSAGE') {
      const result = await OA_INSERT_CHAT_MESSAGE(payload);
      return { success: result.success, data: result.data, message: result.error || '메시지 전송 완료' };
    }

    return { success: false, message: 'Unknown actionType' };
  } catch (error: any) {
    nvLog('AT', '❌ FA_MANAGE_FOXTALK_FLOW 에러', error);
    return { success: false, message: error.message };
  }
}
