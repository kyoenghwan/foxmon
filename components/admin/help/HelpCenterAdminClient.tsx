'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, HelpCircle, MessageCircle } from 'lucide-react';
import {
  adminUpsertNotice,
  adminDeleteNotice,
  adminUpsertFaq,
  adminDeleteFaq,
  adminReplyInquiry,
} from '@/actions/admin/helpCenter';

type Tab = 'notices' | 'faqs' | 'inquiries';

export function HelpCenterAdminClient({
  notices,
  faqs,
  inquiries,
}: {
  notices: any[];
  faqs: any[];
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
        <h2 className="text-2xl font-black text-gray-900">고객센터 콘텐츠</h2>
        <p className="text-[13px] text-gray-500 mt-1">공지·FAQ·1:1 문의 답변을 관리합니다. (/help 에 반영)</p>
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
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notices' && (
        <div className="space-y-4">
          <NoticeForm onSaved={reload} />
          <div className="bg-white rounded-2xl border border-gray-200 divide-y">
            {notices.map((n) => (
              <div key={n.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {n.is_pinned && <span className="text-[10px] font-black text-red-600 mr-2">고정</span>}
                  <span className="text-[11px] text-gray-400 mr-2">{n.category}</span>
                  <span className="font-bold text-gray-900">{n.title}</span>
                </div>
                <div className="flex gap-2">
                  <NoticeForm edit={n} onSaved={reload} compact />
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

      {tab === 'faqs' && (
        <div className="space-y-4">
          <FaqForm onSaved={reload} />
          <div className="bg-white rounded-2xl border border-gray-200 divide-y">
            {faqs.map((f) => (
              <div key={f.id} className="p-4">
                <p className="text-[11px] text-gray-400">{f.category}</p>
                <p className="font-bold text-gray-900">{f.question}</p>
                <div className="flex gap-2 mt-2">
                  <FaqForm edit={f} onSaved={reload} compact />
                  <button
                    type="button"
                    className="text-[12px] font-bold text-red-600"
                    onClick={async () => {
                      if (!confirm('삭제할까요?')) return;
                      await adminDeleteFaq(f.id);
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

      {tab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y">
          {inquiries.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-[14px]">접수된 문의가 없습니다.</p>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] font-black bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{inq.status}</span>
                  <span className="text-[12px] text-gray-500">{inq.category}</span>
                  <span className="font-bold text-gray-900">{inq.title}</span>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {new Date(inq.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[13px] text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{inq.content}</p>
                {inq.reply && (
                  <p className="text-[13px] text-blue-800 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                    <strong>기존 답변:</strong> {inq.reply}
                  </p>
                )}
                <textarea
                  rows={3}
                  value={replyDraft[inq.id] ?? inq.reply ?? ''}
                  onChange={(e) => setReplyDraft((p) => ({ ...p, [inq.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl p-3 text-[13px]"
                  placeholder="관리자 답변 입력"
                />
                <button
                  type="button"
                  className="h-9 px-4 rounded-lg bg-primary text-white text-[12px] font-black"
                  onClick={async () => {
                    const res = await adminReplyInquiry({ id: inq.id, reply: replyDraft[inq.id] || '' });
                    if (res.success) {
                      alert('답변이 저장되었습니다.');
                      reload();
                    } else alert(res.error);
                  }}
                >
                  답변 저장
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NoticeForm({
  edit,
  onSaved,
  compact,
}: {
  edit?: any;
  onSaved: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const [category, setCategory] = useState(edit?.category || '공지');
  const [title, setTitle] = useState(edit?.title || '');
  const [content, setContent] = useState(edit?.content || '');
  const [isPinned, setIsPinned] = useState(!!edit?.is_pinned);

  if (compact && !open) {
    return (
      <button type="button" className="text-[12px] font-bold text-primary" onClick={() => setOpen(true)}>
        수정
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 space-y-2 ${compact ? '' : 'mb-4'}`}>
      {!compact && <h3 className="font-black text-[14px]">{edit ? '공지 수정' : '공지 등록'}</h3>}
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-2 py-1 text-[13px]">
        <option value="공지">공지</option>
        <option value="기타">기타</option>
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full border rounded-lg px-3 py-2 text-[13px]" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="내용" className="w-full border rounded-lg px-3 py-2 text-[13px]" />
      <label className="text-[12px] font-bold flex items-center gap-2">
        <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
        상단 고정(알림)
      </label>
      <button
        type="button"
        className="h-9 px-4 bg-gray-900 text-white rounded-lg text-[12px] font-black"
        onClick={async () => {
          const res = await adminUpsertNotice({
            id: edit?.id,
            category,
            title,
            content,
            is_pinned: isPinned,
          });
          if (res.success) {
            onSaved();
            if (compact) setOpen(false);
            else {
              setTitle('');
              setContent('');
            }
          } else alert(res.error);
        }}
      >
        저장
      </button>
    </div>
  );
}

function FaqForm({ edit, onSaved, compact }: { edit?: any; onSaved: () => void; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const [category, setCategory] = useState(edit?.category || '이용 안내');
  const [question, setQuestion] = useState(edit?.question || '');
  const [answer, setAnswer] = useState(edit?.answer || '');

  if (compact && !open) {
    return (
      <button type="button" className="text-[12px] font-bold text-primary" onClick={() => setOpen(true)}>
        수정
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 space-y-2 ${compact ? '' : 'mb-4'}`}>
      {!compact && <h3 className="font-black text-[14px]">{edit ? 'FAQ 수정' : 'FAQ 등록'}</h3>}
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="카테고리" className="w-full border rounded-lg px-3 py-2 text-[13px]" />
      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="질문" className="w-full border rounded-lg px-3 py-2 text-[13px]" />
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="답변" className="w-full border rounded-lg px-3 py-2 text-[13px]" />
      <button
        type="button"
        className="h-9 px-4 bg-gray-900 text-white rounded-lg text-[12px] font-black"
        onClick={async () => {
          const res = await adminUpsertFaq({ id: edit?.id, category, question, answer });
          if (res.success) {
            onSaved();
            if (compact) setOpen(false);
          } else alert(res.error);
        }}
      >
        저장
      </button>
    </div>
  );
}
