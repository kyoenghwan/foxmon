import { adminListNotices, adminListFaqs, adminListInquiries } from '@/actions/admin/helpCenter';
import { HelpCenterAdminClient } from '@/components/admin/help/HelpCenterAdminClient';

export default async function AdminHelpCenterPage() {
    const [noticesRes, faqsRes, inquiriesRes] = await Promise.all([
        adminListNotices(),
        adminListFaqs(),
        adminListInquiries(),
    ]);

    return (
        <HelpCenterAdminClient
            notices={noticesRes.success ? noticesRes.data : []}
            faqs={faqsRes.success ? faqsRes.data : []}
            inquiries={inquiriesRes.success ? inquiriesRes.data : []}
        />
    );
}
