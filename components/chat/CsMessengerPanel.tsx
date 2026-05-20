'use client';

import { useCallback, useEffect, useState } from 'react';
import { Headset, RefreshCw, Send } from 'lucide-react';
import {
  getCsRoomMessages,
  listCsRoomsForAdmin,
  markCsRoomRead,
  sendCsAdminReply,
} from '@/actions/admin/csMessenger';
import type { CsRoomListItem } from '@/src/atoms/qa/support/QA_LIST_CS_ROOMS';
import { formatChatListTime, formatChatMessageTime } from '@/lib/format-chat-time';
import { supabase } from '@/lib/supabase';

export type CsMessage = {
  id: string;
  content: string;
  created_at: string;
  participant_id?: string | null;
  participant?: { session_id?: string; nickname?: string } | null;
};

type Props = {
  csAdminUserId: string;
  compact?: boolean;
  onCustomerMessage?: () => void;
};

export function CsMessengerPanel({ csAdminUserId, compact, onCustomerMessage }: Props) {
  const [rooms, setRooms] = useState<CsRoomListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CsMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedId);

  const refreshRooms = useCallback(async () => {
    setListError(null);
    const res = await listCsRoomsForAdmin();
    if (res.success && res.data) {
      setRooms(res.data);
      setSelectedId((prev) => prev ?? res.data[0]?.id ?? null);
    } else {
      setListError(res.error || '문의 목록을 불러오지 못했습니다.');
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMsg(true);
    setMsgError(null);
    const res = await getCsRoomMessages(roomId);
    if (res.success) {
      setMessages((res.data as CsMessage[]) || []);
    } else {
      setMessages([]);
      setMsgError(res.error || '대화를 불러오지 못했습니다.');
    }
    setLoadingMsg(false);
  }, []);

  useEffect(() => {
    void refreshRooms();
  }, [refreshRooms]);

  useEffect(() => {
    if (!selectedId || !csAdminUserId) return;
    void loadMessages(selectedId);
    void markCsRoomRead(selectedId, csAdminUserId).then(() => refreshRooms());
  }, [selectedId, csAdminUserId, loadMessages, refreshRooms]);

  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`cs-panel:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'foxtalk_messages',
          filter: `room_id=eq.${selectedId}`,
        },
        async (payload) => {
          const row = payload.new as CsMessage;
          let participant = null;
          if (row.participant_id) {
            const { data: p } = await supabase
              .from('foxtalk_participants')
              .select('*')
              .eq('id', row.participant_id)
              .single();
            participant = p;
          }
          const isCustomer = participant?.session_id !== csAdminUserId;
          if (isCustomer) {
            onCustomerMessage?.();
            void markCsRoomRead(selectedId, csAdminUserId).then(() => refreshRooms());
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, participant }];
          });
          void refreshRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, csAdminUserId, refreshRooms, onCustomerMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    const res = await sendCsAdminReply(selectedId, reply);
    setSending(false);
    if (!res.success) {
      alert(res.error || '전송에 실패했습니다.');
      return;
    }
    setReply('');
    await loadMessages(selectedId);
    await refreshRooms();
  };

  return (
    <div
      className={`grid gap-0 min-h-0 flex-1 ${
        compact ? 'grid-cols-1 sm:grid-cols-[200px_1fr]' : 'grid-cols-1 lg:grid-cols-[240px_1fr]'
      }`}
    >
      <div className="border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col min-h-[120px] max-h-[220px] sm:max-h-none">
        <div className="p-2 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <span className="text-[11px] font-black text-gray-600">문의 {rooms.length}</span>
          <button type="button" onClick={() => void refreshRooms()} className="p-1 rounded hover:bg-gray-200">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => setSelectedId(room.id)}
                className={`w-full text-left p-2.5 hover:bg-orange-50/60 relative ${
                  selectedId === room.id ? 'bg-orange-50 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="font-black text-[12px] truncate flex-1">
                    {room.customer_nickname || room.title}
                  </p>
                  {room.has_unread ? (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                      N
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  {room.last_message_preview || '—'}
                </p>
                {room.last_message_at ? (
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {formatChatListTime(room.last_message_at)}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
          {listError ? (
            <li className="p-4 text-center text-[11px] text-red-600 font-bold">{listError}</li>
          ) : null}
          {rooms.length === 0 && !listError ? (
            <li className="p-6 text-center text-[12px] text-gray-400">문의 없음</li>
          ) : null}
        </ul>
      </div>

      <div className="flex flex-col min-h-[280px] flex-1">
        {selectedRoom ? (
          <>
            <div className="p-2.5 border-b shrink-0">
              <p className="font-black text-[13px] flex items-center gap-1">
                <Headset className="w-4 h-4 text-primary" />
                {selectedRoom.customer_nickname || selectedRoom.title}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
              {msgError ? (
                <p className="text-center text-xs text-red-600 font-bold">{msgError}</p>
              ) : null}
              {loadingMsg ? (
                <p className="text-center text-xs text-gray-400">불러오는 중…</p>
              ) : (
                messages.map((msg) => {
                  const isStaff = msg.participant?.session_id === csAdminUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-2.5 py-2 text-[12px] ${
                          isStaff
                            ? 'bg-primary text-black rounded-tr-sm'
                            : 'bg-white border border-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {!isStaff && (
                          <p className="text-[9px] font-black text-blue-600 mb-0.5">
                            {msg.participant?.nickname || '고객'}
                          </p>
                        )}
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                        {formatChatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSend} className="p-2 border-t flex gap-2 shrink-0">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="답변 입력…"
                className="flex-1 h-10 px-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <p className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8">
            문의를 선택하세요
          </p>
        )}
      </div>
    </div>
  );
}
