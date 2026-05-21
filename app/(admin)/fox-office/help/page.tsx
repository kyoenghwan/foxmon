import {
    adminListNotices,
    adminListFaqs,
    adminListFaqCategories,
    adminListInquiries,
} from '@/actions/admin/helpCenter';
import { HelpCenterAdminClient } from '@/components/admin/help/HelpCenterAdminClient';

export default async function AdminHelpCenterPage() {
    const [noticesRes, categoriesRes, faqsRes, inquiriesRes] = await Promise.all([
        adminListNotices(),
        adminListFaqCategories(),
        adminListFaqs(),
        adminListInquiries(),
    ]);

    return (
        <HelpCenterAdminClient
            notices={noticesRes.success ? noticesRes.data : []}
            faqCategories={categoriesRes.success ? categoriesRes.data : []}
            faqs={faqsRes.success ? faqsRes.data : []}
            inquiries={inquiriesRes.success ? inquiriesRes.data : []}
        />
    );
}
