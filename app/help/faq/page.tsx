import { getPublicFaqs, getPublicFaqCategories } from '@/lib/actions/help';
import { FaqPageClient } from '@/components/help/FaqPageClient';

export default async function FaqPage() {
    const [faqs, categories] = await Promise.all([getPublicFaqs(), getPublicFaqCategories()]);
    return <FaqPageClient initialFaqs={faqs} categories={categories} />;
}
