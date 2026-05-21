'use client';

import { useRef, useState } from 'react';
import { Image, Bold, Link2, List, Code, Eye, Pencil } from 'lucide-react';
import { uploadHelpFaqImage } from '@/lib/actions/help-upload';
import { MarkdownContent } from '@/components/help/MarkdownContent';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function MarkdownFaqEditor({ value, onChange, placeholder }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || '텍스트';
    const snippet = before + selected + after;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadHelpFaqImage(fd);
    setUploading(false);
    if (res.success && res.markdown) {
      insertAtCursor('\n' + res.markdown + '\n');
    } else {
      alert(res.message || '업로드 실패');
    }
  };

  const tools = [
    { icon: Bold, label: '굵게', action: () => wrapSelection('**', '**') },
    { icon: Link2, label: '링크', action: () => wrapSelection('[', '](https://)') },
    { icon: List, label: '목록', action: () => insertAtCursor('\n- 항목\n') },
    { icon: Code, label: '코드', action: () => insertAtCursor('\n```\n내용\n```\n') },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-100 bg-gray-50">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onClick={t.action}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
        <button
          type="button"
          title="이미지 첨부"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-50"
        >
          <Image className="w-4 h-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f);
            e.target.value = '';
          }}
        />
        <span className="text-[11px] text-gray-400 font-medium px-2">
          {uploading ? '업로드 중…' : 'Markdown · 이미지'}
        </span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
              mode === 'edit' ? 'bg-white shadow text-primary' : 'text-gray-500'
            }`}
          >
            <Pencil className="w-3 h-3" /> 작성
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
              mode === 'preview' ? 'bg-white shadow text-primary' : 'text-gray-500'
            }`}
          >
            <Eye className="w-3 h-3" /> 미리보기
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          placeholder={placeholder || 'Markdown으로 답변을 작성하세요.\n\n예)\n## 안내\n- 항목 1\n- 항목 2\n\n![설명](이미지URL)'}
          className="w-full px-4 py-3 text-[13px] font-mono leading-relaxed resize-y min-h-[200px] focus:outline-none"
        />
      ) : (
        <div className="px-4 py-4 min-h-[200px]">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-gray-400 text-[13px]">미리볼 내용이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
