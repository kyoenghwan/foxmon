import { getPublicNotices } from '@/lib/actions/help';
import { NoticePageClient } from '@/components/help/NoticePageClient';

export default async function NoticePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const params = await searchParams;
    const notices = await getPublicNotices();
    return <NoticePageClient initialNotices={notices} initialTab={params.tab || '전체'} />;
}
