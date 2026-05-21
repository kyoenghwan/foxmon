'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import type { PublicFaq, PublicFaqCategory } from '@/lib/actions/help';
import { MarkdownContent } from '@/components/help/MarkdownContent';

const FALLBACK_CATEGORIES: PublicFaqCategory[] = [
  { id: '1', name: '이용 안내', sort_order: 1 },
  { id: '2', name: '포인트·결제', sort_order: 2 },
  { id: '3', name: '광고 문의', sort_order: 3 },
  { id: '4', name: '이력서·지원', sort_order: 4 },
  { id: '5', name: '기타', sort_order: 5 },
];

function FaqItem({ faq }: { faq: PublicFaq }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMarkdown = faq.answer_format !== 'html';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-primary font-black text-[15px] shrink-0">Q</span>
        <span className="flex-1 text-[14px] font-bold text-gray-800">{faq.question}</span>
        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{faq.category}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 flex gap-3">
          <span className="text-blue-500 font-black text-[15px] shrink-0">A</span>
          <div className="flex-1 min-w-0">
            {isMarkdown ? (
              <MarkdownContent content={faq.answer} />
            ) : (
              <div
                className="text-[14px] text-gray-600 leading-relaxed prose-sm"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FaqPageClient({
  initialFaqs,
  categories,
}: {
  initialFaqs: PublicFaq[];
  categories: PublicFaqCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState('전체');
  const tabs = categories.length ? categories : FALLBACK_CATEGORIES;

  const filtered =
    activeCategory === '전체'
      ? initialFaqs
      : initialFaqs.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> 자주 묻는 질문
        </h2>
        <p className="text-[13px] text-gray-500 font-medium mt-1">
          궁금한 사항은 아래에서 찾아보시고, 해결되지 않으면 1:1 문의를 이용해주세요.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveCategory('전체')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
            activeCategory === '전체'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {tabs.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
              activeCategory === cat.name
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.map((faq) => (
          <FaqItem key={faq.id} faq={faq} />
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-[14px] font-medium">
            해당 카테고리의 FAQ가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
