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
  if (pathname.startsWith('/cs')) {
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
      <button
        type="button"
        onClick={() => {
          window.location.href = '/cs';
        }}
        className="fixed z-[70] right-5 bottom-6 flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-gray-900 text-white shadow-2xl hover:bg-black transition-all border border-gray-800"
        aria-label="고객센터 상담 답변 페이지 이동"
      >
        <Headset className="w-5 h-5 text-primary shrink-0 animate-bounce" />
        <span className="text-[13px] font-black whitespace-nowrap">고객센터 답변</span>
        {unread > 0 ? (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-black flex items-center justify-center animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>
    </>
  );
}
