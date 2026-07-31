'use client';

import { useState } from 'react';
import { MarkdownFaqEditor } from './MarkdownFaqEditor';

type NoticeRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  content_format?: string;
  is_pinned: boolean;
  target_role?: 'ALL' | 'EMPLOYER' | 'GENERAL';
};

export function NoticeForm({
  edit,
  onSaved,
  compact,
  onSave,
}: {
  edit?: NoticeRow;
  onSaved: () => void;
  compact?: boolean;
  onSave: (data: {
    id?: string;
    category: string;
    title: string;
    content: string;
    is_pinned: boolean;
    content_format: string;
    target_role: 'ALL' | 'EMPLOYER' | 'GENERAL';
  }) => Promise<{ success: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(!compact);
  const [category, setCategory] = useState(edit?.category || '공지');
  const [title, setTitle] = useState(edit?.title || '');
  const [content, setContent] = useState(edit?.content || '');
  const [isPinned, setIsPinned] = useState(!!edit?.is_pinned);
  const [targetRole, setTargetRole] = useState<'ALL' | 'EMPLOYER' | 'GENERAL'>(edit?.target_role || 'ALL');
  const [saving, setSaving] = useState(false);

  if (compact && !open) {
    return (
      <button type="button" className="text-[12px] font-bold text-primary" onClick={() => setOpen(true)}>
        수정
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 space-y-3 ${compact ? '' : 'mb-4'}`}>
      {!compact && <h3 className="font-black text-[15px]">{edit ? '공지 수정' : '공지 등록'}</h3>}

      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-lg text-[13px] font-bold"
        >
          <option value="공지">공지</option>
          <option value="이벤트">이벤트</option>
          <option value="기타">기타</option>
        </select>
        
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value as 'ALL' | 'EMPLOYER' | 'GENERAL')}
          className="h-10 px-3 border border-orange-200 bg-orange-50 text-primary rounded-lg text-[13px] font-bold"
        >
          <option value="ALL">전체 공개 (ALL)</option>
          <option value="EMPLOYER">업체 회원 전용 (EMPLOYER)</option>
          <option value="GENERAL">일반 회원 전용 (GENERAL)</option>
        </select>

        <label className="inline-flex items-center gap-2 text-[12px] font-bold text-gray-700 h-10">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          상단 고정(알림)
        </label>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] font-bold"
      />

      <div>
        <span className="text-[12px] font-bold text-gray-600">내용 (Markdown · 이미지 첨부)</span>
        <div className="mt-1">
          <MarkdownFaqEditor value={content} onChange={setContent} />
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        className="h-10 px-5 bg-gray-900 text-white rounded-lg text-[13px] font-black disabled:opacity-50"
        onClick={async () => {
          setSaving(true);
          const res = await onSave({
            id: edit?.id,
            category,
            title,
            content,
            is_pinned: isPinned,
            content_format: 'markdown',
            target_role: targetRole,
          });
          setSaving(false);
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
        {saving ? '저장 중…' : '저장'}
      </button>
    </div>
  );
}
