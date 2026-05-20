'use client';

import { useCallback, useEffect, useState } from 'react';
import { Headset, MessageCircle, RefreshCw, Send } from 'lucide-react';
import {
  getCsRoomMessages,
  listCsRoomsForAdmin,
  sendCsAdminReply,
} from '@/actions/admin/csMessenger';
import type { CsRoomListItem } from '@/src/atoms/qa/support/QA_LIST_CS_ROOMS';
import { supabase } from '@/lib/supabase';

type CsMessage = {
  id: string;
  content: string;
  created_at: string;
  participant_id?: string | null;
  participant?: { session_id?: string; nickname?: string; avatar_type?: string } | null;
};

type Props = {
  initialRooms: CsRoomListItem[];
  csAdminUserId?: string;
};

export function CsMessengerInbox({ initialRooms, csAdminUserId }: Props) {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedId, setSelectedId] = useState<string | null>(initialRooms[0]?.id ?? null);
  const [messages, setMessages] = useState<CsMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === selectedId);

  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMsg(true);
    const res = await getCsRoomMessages(roomId);
    if (res.success) setMessages((res.data as CsMessage[]) || []);
    setLoadingMsg(false);
  }, []);

  const refreshRooms = useCallback(async () => {
    const res = await listCsRoomsForAdmin();
    if (res.success && res.data) {
      setRooms(res.data);
      if (!selectedId && res.data[0]) setSelectedId(res.data[0].id);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`cs-inbox:${selectedId}`)
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, participant }];
          });
          refreshRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, refreshRooms]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[520px]">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-3 border-b flex items-center justify-between bg-gray-50">
          <span className="text-[12px] font-black text-gray-700">문의 목록 ({rooms.length})</span>
          <button
            type="button"
            onClick={refreshRooms}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => setSelectedId(room.id)}
                className={`w-full text-left p-3 hover:bg-orange-50/50 transition ${
                  selectedId === room.id ? 'bg-orange-50 border-l-4 border-primary' : ''
                }`}
              >
                <p className="font-black text-[13px] text-gray-900 truncate">
                  {room.customer_nickname || room.title}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {room.last_message_preview || '메시지 없음'}
                </p>
                {room.last_message_at ? (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(room.last_message_at).toLocaleString()}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
          {rooms.length === 0 ? (
            <li className="p-8 text-center text-[13px] text-gray-500 font-medium">문의가 없습니다.</li>
          ) : null}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-white">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <Headset className="w-5 h-5 text-primary" />
                {selectedRoom.customer_nickname || selectedRoom.title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                고객 ID: {selectedRoom.created_by.slice(0, 8)}… · 답변 계정:{' '}
                {csAdminUserId ? `${csAdminUserId.slice(0, 8)}…` : '미지정'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 min-h-[320px]">
              {loadingMsg ? (
                <p className="text-center text-sm text-gray-500">불러오는 중…</p>
              ) : (
                messages.map((msg) => {
                  const isStaff =
                    !!csAdminUserId && msg.participant?.session_id === csAdminUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] shadow-sm ${
                          isStaff
                            ? 'bg-primary text-black rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        }`}
                      >
                        {!isStaff && (
                          <p className="text-[10px] font-black text-blue-600 mb-1">
                            {msg.participant?.nickname || '고객'}
                          </p>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="답변을 입력하세요…"
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="h-11 px-4 rounded-xl bg-gray-900 text-white font-black text-sm flex items-center gap-1 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                전송
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-bold text-sm">왼쪽에서 문의를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
