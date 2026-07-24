'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Headset, X } from 'lucide-react';
import { isAdminRole } from '@/lib/normalize-user-role';
import { CsMessengerPanel } from '@/components/chat/CsMessengerPanel';
import { playCsNotificationSound } from '@/lib/play-cs-notification';
import { supabase } from '@/lib/supabase';

export function CsAgentDock() {
  const pathname = usePathname();
  if (pathname.startsWith('/cs') || pathname.startsWith('/fox-office')) {
    return null;
  }
  const { data: session, status } = useSession();
  const [eligible, setEligible] = useState(false);
  const [csAdminUserId, setCsAdminUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(open);
  openRef.current = open;

  const sessionUser = session?.user as
    | { id?: string; role?: string; login_id?: string }
    | undefined;

  useEffect(() => {
    if (status !== 'authenticated' || !sessionUser?.id) {
      setEligible(false);
      setCsAdminUserId(null);
      return;
    }

    const loginId = String(sessionUser.login_id || '').trim().toLowerCase();
    const canShow =
      isAdminRole(sessionUser.role) || loginId.startsWith('foxmon_');

    if (!canShow) {
      setEligible(false);
      setCsAdminUserId(null);
      return;
    }

    fetch('/api/cs-agent/eligible', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { eligible?: boolean; csAdminUserId?: string }) => {
        const adminId = data.csAdminUserId || sessionUser.id || null;
        setEligible(!!data.eligible || canShow);
        setCsAdminUserId(adminId);
      })
      .catch(() => {
        if (canShow) {
          setEligible(true);
          setCsAdminUserId(sessionUser.id || null);
        }
      });
  }, [status, sessionUser?.id, sessionUser?.role, sessionUser?.login_id]);

  const onCustomerMessage = useCallback(() => {
    if (!openRef.current) {
      setUnread((n) => n + 1);
      playCsNotificationSound();
    }
  }, []);

  useEffect(() => {
    if (!eligible || !csAdminUserId) return;

    const channel = supabase
      .channel('cs-agent-global-notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'foxtalk_messages' },
        async (payload) => {
          const row = payload.new as { room_id?: string; participant_id?: string };
          if (!row.room_id || !row.participant_id) return;

          const { data: room } = await supabase
            .from('foxtalk_rooms')
            .select('type')
            .eq('id', row.room_id)
            .single();
          if (room?.type !== 'CS') return;

          const { data: p } = await supabase
            .from('foxtalk_participants')
            .select('session_id')
            .eq('id', row.participant_id)
            .single();

          if (p?.session_id === csAdminUserId) return;
          if (openRef.current) return;

          onCustomerMessage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eligible, csAdminUserId, onCustomerMessage]);

  if (!eligible || !csAdminUserId) return null;
  if (pathname?.startsWith('/fox-office/support/inbox')) return null;
  if (pathname?.startsWith('/render-banners')) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setUnread(0);
          }}
          className="fixed z-[70] left-5 bottom-6 flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-gray-900 text-white shadow-2xl hover:bg-black transition-all"
          aria-label="고객센터 상담 답변"
        >
          <Headset className="w-5 h-5 text-primary shrink-0" />
          <span className="text-[13px] font-black whitespace-nowrap">고객센터 답변</span>
          {unread > 0 ? (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-black flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>
      ) : (
        <div
          className="fixed z-[55] left-4 bottom-4 w-[min(100vw-2rem,600px)] h-[min(80vh,620px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white shrink-0">
            <div>
              <p className="font-black text-[15px]">고객센터 상담</p>
              <p className="text-[11px] font-medium opacity-90">홈 화면에서 실시간 답변</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-white/20"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <CsMessengerPanel
              csAdminUserId={csAdminUserId}
              compact
              onCustomerMessage={() => playCsNotificationSound()}
            />
          </div>
        </div>
      )}
    </>
  );
}
