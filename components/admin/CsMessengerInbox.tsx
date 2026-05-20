'use client';

import { CsMessengerPanel } from '@/components/chat/CsMessengerPanel';
type Props = {
  csAdminUserId: string;
};

export function CsMessengerInbox({ csAdminUserId }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 min-h-[520px] flex flex-col overflow-hidden">
      <CsMessengerPanel csAdminUserId={csAdminUserId} />
    </div>
  );
}
