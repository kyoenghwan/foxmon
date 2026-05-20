import { auth } from '@/auth';
import { getMyInquiries } from '@/lib/actions/help';
import { InquiryPageClient } from '@/components/help/InquiryPageClient';

export default async function InquiryPage() {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const { inquiries } = isLoggedIn ? await getMyInquiries() : { inquiries: [] };

    return <InquiryPageClient initialInquiries={inquiries} isLoggedIn={isLoggedIn} />;
}
