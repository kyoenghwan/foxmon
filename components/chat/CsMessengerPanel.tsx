'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Headset, RefreshCw, Search, Send, X } from 'lucide-react';
import {
  getCsRoomMessages,
  listCsRoomsForAdmin,
  markCsRoomRead,
  sendCsAdminReply,
  closeCsRoom,
} from '@/actions/admin/csMessenger';
import type { CsRoomListItem } from '@/src/atoms/qa/support/QA_LIST_CS_ROOMS';
import type { CsRoomSearchFilters } from '@/lib/cs-search';
import { formatChatListTime, formatChatMessageTime } from '@/lib/format-chat-time';
import { supabase } from '@/lib/supabase';

export type CsMessage = {
  id: string;
  content: string;
  created_at: string;
  participant_id?: string | null;
  participant?: { session_id?: string; nickname?: string } | null;
};

function highlightContent(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.trim();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

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
  const [searching, setSearching] = useState(false);

  const [searchLogin, setSearchLogin] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<CsRoomSearchFilters>({});
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);

  const displayRooms = useMemo(() => {
    if (!onlyUnanswered) return rooms;
    return rooms.filter((r) => r.last_sender_is_customer);
  }, [rooms, onlyUnanswered]);

  const selectedRoom = displayRooms.find((r) => r.id === selectedId);

  const buildFilters = useCallback((): CsRoomSearchFilters => {
    const f: CsRoomSearchFilters = {};
    if (searchLogin.trim()) f.loginId = searchLogin.trim();
    if (searchDateFrom) f.dateFrom = searchDateFrom;
    if (searchDateTo) f.dateTo = searchDateTo;
    if (searchContent.trim()) f.content = searchContent.trim();
    return f;
  }, [searchLogin, searchDateFrom, searchDateTo, searchContent]);

  const refreshRooms = useCallback(
    async (filters?: CsRoomSearchFilters) => {
      setListError(null);
      const res = await listCsRoomsForAdmin(filters);
      if (res.success && res.data) {
        setRooms(res.data);
        setSelectedId((prev) => {
          if (prev && res.data!.some((r) => r.id === prev)) return prev;
          return res.data![0]?.id ?? null;
        });
      } else {
        setListError(res.error || '문의 목록을 불러오지 못했습니다.');
      }
    },
    []
  );

  const runSearch = useCallback(async () => {
    const filters = buildFilters();
    setAppliedFilters(filters);
    setSearching(true);
    await refreshRooms(filters);
    setSearching(false);
  }, [buildFilters, refreshRooms]);

  const clearSearch = useCallback(async () => {
    setSearchLogin('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setSearchContent('');
    setAppliedFilters({});
    await refreshRooms();
  }, [refreshRooms]);

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

  // 전체 방 목록 및 메시지 실시간 감지 구독
  useEffect(() => {
    // 1. 초기 1회 로드
    void refreshRooms();

    // 2. foxtalk_rooms 테이블 변경 감지 채널 (새 상담 개설 등)
    const roomsChannel = supabase
      .channel('realtime-cs-rooms-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'foxtalk_rooms' },
        () => {
          void refreshRooms(appliedFilters);
        }
      )
      .subscribe();

    // 3. foxtalk_messages 테이블 신규 등록 감지 채널 (다른 방 새 메시지 도착 등)
    const msgsChannel = supabase
      .channel('realtime-cs-messages-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'foxtalk_messages' },
        () => {
          void refreshRooms(appliedFilters);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(roomsChannel);
      void supabase.removeChannel(msgsChannel);
    };
  }, [refreshRooms, appliedFilters]);

  useEffect(() => {
    if (!selectedId || !csAdminUserId) return;
    void loadMessages(selectedId);
    void markCsRoomRead(selectedId, csAdminUserId).then(() => refreshRooms(appliedFilters));
  }, [selectedId, csAdminUserId, loadMessages, refreshRooms, appliedFilters]);

  useEffect(() => {
    if (!selectedId) return;

    // Supabase Realtime 필터링 버그를 원천 차단하기 위해 
    // 테이블 전체의 INSERT 이벤트를 구독하고 자바스크립트 단에서 selectedId 일치 여부를 검사합니다.
    const channel = supabase
      .channel(`cs-panel-msgs:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'foxtalk_messages',
        },
        async (payload) => {
          const row = payload.new as any;
          
          // 현재 선택된 활성화 방의 메시지일 경우에만 실시간 대화창 최신화
          if (row.room_id === selectedId) {
            // 전체 메시지 조인 쿼리 재로드 실행
            void loadMessages(selectedId);

            // 고객 메시지인지 체크 (participant_id의 session_id가 csAdminUserId와 다를 경우)
            let isCustomer = true;
            if (row.participant_id) {
              const { data: participant } = await supabase
                .from('foxtalk_participants')
                .select('session_id')
                .eq('id', row.participant_id)
                .maybeSingle();
              if (participant && participant.session_id === csAdminUserId) {
                isCustomer = false;
              }
            }

            if (isCustomer) {
              onCustomerMessage?.();
              void markCsRoomRead(selectedId, csAdminUserId).then(() => refreshRooms(appliedFilters));
            } else {
              void refreshRooms(appliedFilters);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId, csAdminUserId, loadMessages, refreshRooms, onCustomerMessage, appliedFilters]);

  const contentQuery = appliedFilters.content || '';
  const displayMessages = useMemo(() => {
    if (!contentQuery.trim()) return messages;
    const q = contentQuery.trim().toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, contentQuery]);

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
    await refreshRooms(appliedFilters);
  };

  const handleCloseRoom = async () => {
    if (!selectedId) return;
    if (
      !confirm(
        '이 상담을 종료하시겠습니까?\n종료 시 목록에서 사라지지만 이전 상담 이력은 안전하게 보존됩니다.'
      )
    ) {
      return;
    }
    
    setSending(true);
    const res = await closeCsRoom(selectedId);
    setSending(false);
    
    if (res.success) {
      alert('상담이 종료되었습니다.');
      setSelectedId(null);
      await refreshRooms(appliedFilters);
    } else {
      alert(res.error || '상담을 종료하지 못했습니다.');
    }
  };

  const hasSearch =
    !!searchLogin.trim() ||
    !!searchDateFrom ||
    !!searchDateTo ||
    !!searchContent.trim();

  return (
    <div
      className={`grid gap-0 min-h-0 flex-1 ${
        compact
          ? 'grid-cols-1 sm:grid-cols-[220px_1fr]'
          : 'grid-cols-1 lg:grid-cols-[280px_1fr]'
      }`}
    >
      <div className="border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col min-h-[120px] max-h-[280px] sm:max-h-none">
        <div className="p-2 border-b bg-gray-50 shrink-0 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-gray-600">
                문의 {onlyUnanswered ? displayRooms.length : rooms.length}
              </span>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer select-none bg-orange-50/50 hover:bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyUnanswered}
                  onChange={(e) => setOnlyUnanswered(e.target.checked)}
                  className="w-3 h-3 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                />
                미답변만
              </label>
            </div>
            <div className="flex gap-1">
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => void clearSearch()}
                  className="p-1 rounded hover:bg-gray-200"
                  title="검색 초기화"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void refreshRooms(appliedFilters)}
                className="p-1 rounded hover:bg-gray-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={searchLogin}
              onChange={(e) => setSearchLogin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
              placeholder="아이디·닉네임"
              className="w-full h-8 px-2 rounded-lg border border-gray-200 text-[11px] font-medium"
            />
            {!compact ? (
              <div className="flex gap-1">
                <input
                  type="date"
                  value={searchDateFrom}
                  onChange={(e) => setSearchDateFrom(e.target.value)}
                  className="flex-1 h-8 px-1 rounded-lg border border-gray-200 text-[10px]"
                  title="시작일"
                />
                <input
                  type="date"
                  value={searchDateTo}
                  onChange={(e) => setSearchDateTo(e.target.value)}
                  className="flex-1 h-8 px-1 rounded-lg border border-gray-200 text-[10px]"
                  title="종료일"
                />
              </div>
            ) : null}
            <div className="flex gap-1">
              <input
                type="text"
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
                placeholder="대화 내용 검색"
                className="flex-1 h-8 px-2 rounded-lg border border-gray-200 text-[11px] font-medium"
              />
              <button
                type="button"
                onClick={() => void runSearch()}
                disabled={searching}
                className="h-8 px-2 rounded-lg bg-gray-900 text-white flex items-center gap-1 text-[11px] font-black disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {displayRooms.map((room) => (
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
                {room.customer_login_id ? (
                  <p className="text-[9px] text-gray-500 font-bold truncate">
                    @{room.customer_login_id}
                  </p>
                ) : null}
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
          {displayRooms.length === 0 && !listError ? (
            <li className="p-6 text-center text-[12px] text-gray-400">
              {hasSearch ? '검색 결과 없음' : '문의 없음'}
            </li>
          ) : null}
        </ul>
      </div>

      <div className="flex flex-col min-h-[280px] flex-1">
        {selectedRoom ? (
          <>
            <div className="p-2.5 border-b shrink-0">
              <div className="flex justify-between items-center gap-2">
                <div>
                  <p className="font-black text-[13px] flex items-center gap-1">
                    <Headset className="w-4 h-4 text-primary" />
                    {selectedRoom.customer_nickname || selectedRoom.title}
                  </p>
                  {selectedRoom.customer_login_id ? (
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                      아이디: {selectedRoom.customer_login_id}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleCloseRoom}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-black text-[11px] rounded-lg border border-red-200/50 transition-all active:scale-[0.98] shrink-0"
                >
                  상담 종료
                </button>
              </div>
              {contentQuery ? (
                <p className="text-[10px] text-primary font-bold mt-1">
                  대화 내 「{contentQuery}」 검색 · {displayMessages.length}건
                </p>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
              {msgError ? (
                <p className="text-center text-xs text-red-600 font-bold">{msgError}</p>
              ) : null}
              {loadingMsg ? (
                <p className="text-center text-xs text-gray-400">불러오는 중…</p>
              ) : displayMessages.length === 0 && contentQuery ? (
                <p className="text-center text-xs text-gray-400">이 방에 해당 내용이 없습니다.</p>
              ) : (
                displayMessages.map((msg) => {
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
                        {highlightContent(msg.content, contentQuery)}
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
