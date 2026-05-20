import { getPublicFaqs } from '@/lib/actions/help';
import { FaqPageClient } from '@/components/help/FaqPageClient';

export default async function FaqPage() {
    const faqs = await getPublicFaqs();
    return <FaqPageClient initialFaqs={faqs} />;
}
