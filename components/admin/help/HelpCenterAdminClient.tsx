'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, HelpCircle, MessageCircle } from 'lucide-react';
import {
  adminUpsertNotice,
  adminDeleteNotice,
  adminReplyInquiry,
} from '@/actions/admin/helpCenter';
import { FaqAdminPanel } from './FaqAdminPanel';
import { NoticeForm } from './NoticeAdminPanel';
import { MarkdownContent } from '@/components/help/MarkdownContent';

type Tab = 'notices' | 'faqs' | 'inquiries';

export function HelpCenterAdminClient({
  notices,
  faqs,
  faqCategories,
  inquiries,
}: {
  notices: any[];
  faqs: any[];
  faqCategories: any[];
  inquiries: any[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('notices');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const tabs: { id: Tab; label: string; icon: typeof Bell }[] = [
    { id: 'notices', label: '공지사항', icon: Bell },
    { id: 'faqs', label: 'FAQ', icon: HelpCircle },
    { id: 'inquiries', label: '1:1 문의', icon: MessageCircle },
  ];

  const reload = () => router.refresh();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">고객센터 콘텐츠 관리</h2>
        <p className="text-[13px] text-gray-500 mt-1">공지사항 · 자주하는 질문(FAQ) · 1:1 문의 답변을 관리합니다. (사용자 /help 페이지에 반영)</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold ${
              tab === t.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.id === 'faqs' ? '자주하는 질문 (FAQ)' : t.label}
          </button>
        ))}
      </div>

      {tab === 'notices' && (
        <div className="space-y-4">
          <NoticeForm
            onSaved={reload}
            onSave={(data) => adminUpsertNotice(data)}
          />
          <div className="bg-white rounded-2xl border border-gray-200 divide-y">
            {notices.map((n) => (
              <div key={n.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {n.is_pinned && <span className="text-[10px] font-black text-red-600 mr-2">고정</span>}
                  <span className="text-[11px] text-gray-400 mr-2">{n.category}</span>
                  <span className="font-bold text-gray-900">{n.title}</span>
                </div>
                <div className="flex gap-2">
                  <NoticeForm edit={n} onSaved={reload} compact onSave={(data) => adminUpsertNotice(data)} />
                  <button
                    type="button"
                    className="text-[12px] font-bold text-red-600"
                    onClick={async () => {
                      if (!confirm('삭제할까요?')) return;
                      await adminDeleteNotice(n.id);
                      reload();
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'faqs' && <FaqAdminPanel categories={faqCategories} faqs={faqs} />}

      {tab === 'inquiries' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-800 leading-relaxed">
            <p className="font-black">1:1 문의 표시 규칙</p>
            <ul className="mt-2 space-y-1 list-disc pl-5 font-medium">
              <li>
                <strong>회원(고객센터 /help/inquiry):</strong> 본인이 접수한 문의만 목록에 보입니다. 다른 회원 문의는
                볼 수 없습니다.
              </li>
              <li>
                <strong>운영자(이 화면):</strong> ADMIN·foxmon_ 운영 계정·CS 담당 등 권한이 있는 분은{' '}
                <strong>전체 회원 문의</strong>를 보고 답변할 수 있습니다.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y">
            {inquiries.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-[14px]">접수된 문의가 없습니다.</p>
            ) : (
              inquiries.map((inq) => {
                const u = inq.users as { login_id?: string; nickname?: string; name?: string } | null;
                const who =
                  u?.nickname || u?.name || u?.login_id || `회원(${String(inq.user_id || '').slice(0, 8)}…)`;
                return (
                  <div key={inq.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] font-black bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        {inq.status}
                      </span>
                      <span className="text-[12px] text-gray-500">{inq.category}</span>
                      <span className="font-bold text-gray-900">{inq.title}</span>
                      <span className="text-[11px] text-gray-500">문의자: {who}</span>
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {new Date(inq.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-[13px] text-gray-700">
                      <p className="font-bold text-gray-500 text-[11px] mb-1">문의 내용</p>
                      <p className="whitespace-pre-wrap">{inq.content}</p>
                    </div>
                    {inq.reply && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-bold text-blue-600 text-[11px] mb-1">저장된 답변</p>
                        <MarkdownContent content={inq.reply} />
                      </div>
                    )}
                    <textarea
                      rows={4}
                      value={replyDraft[inq.id] ?? inq.reply ?? ''}
                      onChange={(e) => setReplyDraft((p) => ({ ...p, [inq.id]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl p-3 text-[13px] font-mono"
                      placeholder="관리자 답변 (Markdown 가능)"
                    />
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg bg-primary text-white text-[12px] font-black"
                      onClick={async () => {
                        const res = await adminReplyInquiry({ id: inq.id, reply: replyDraft[inq.id] || '' });
                        if (res.success) {
                          alert('답변이 저장되었습니다. 해당 회원의 1:1 문의 목록에 표시됩니다.');
                          reload();
                        } else alert(res.error);
                      }}
                    >
                      답변 저장
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

