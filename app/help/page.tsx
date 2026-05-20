import { getPublicNotices } from '@/lib/actions/help';
import { NoticePageClient } from '@/components/help/NoticePageClient';

export default async function NoticePage() {
    const notices = await getPublicNotices();
    return <NoticePageClient initialNotices={notices} />;
}
