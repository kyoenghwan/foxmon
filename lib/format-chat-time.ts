/** 채팅 메시지용 날짜·시간 표시 (한국어) */
export function formatChatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;
  if (isYesterday) return `어제 ${time}`;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatListTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return formatChatMessageTime(iso);
}
