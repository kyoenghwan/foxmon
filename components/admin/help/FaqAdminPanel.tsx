'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, GripVertical, Trash2, Pencil } from 'lucide-react';
import {
  adminUpsertFaq,
  adminDeleteFaq,
  adminUpsertFaqCategory,
  adminDeleteFaqCategory,
} from '@/actions/admin/helpCenter';
import { MarkdownFaqEditor } from './MarkdownFaqEditor';

export type FaqCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type FaqRow = {
  id: string;
  category_id?: string | null;
  category?: string;
  question: string;
  answer: string;
  answer_format?: string;
  sort_order: number;
  is_active: boolean;
  target_role?: 'ALL' | 'EMPLOYER' | 'GENERAL';
};

export function FaqAdminPanel({
  categories: initialCategories,
  faqs: initialFaqs,
}: {
  categories: FaqCategoryRow[];
  faqs: FaqRow[];
 }) {
  const router = useRouter();
  const reload = () => router.refresh();

  const [categories, setCategories] = useState(initialCategories);
  const [faqs] = useState(initialFaqs);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<FaqRow | null>(null);
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id || '');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [targetRole, setTargetRole] = useState<'ALL' | 'EMPLOYER' | 'GENERAL'>('ALL');
  const [saving, setSaving] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const faqsByCategory = useMemo(() => {
    const map = new Map<string, FaqRow[]>();
    for (const c of sortedCategories) map.set(c.id, []);
    for (const f of faqs) {
      const cid = f.category_id || sortedCategories.find((c) => c.name === f.category)?.id;
      if (cid && map.has(cid)) map.get(cid)!.push(f);
      else if (sortedCategories[0]) map.get(sortedCategories[0].id)!.push(f);
    }
    return map;
  }, [faqs, sortedCategories]);

  const openCreate = () => {
    setEditFaq(null);
    setCategoryId(sortedCategories[0]?.id || '');
    setQuestion('');
    setAnswer('');
    setSortOrder(0);
    setTargetRole('ALL');
    setFormOpen(true);
  };

  const openEdit = (f: FaqRow) => {
    setEditFaq(f);
    setCategoryId(f.category_id || sortedCategories.find((c) => c.name === f.category)?.id || '');
    setQuestion(f.question);
    setAnswer(f.answer);
    setSortOrder(f.sort_order ?? 0);
    setTargetRole(f.target_role || 'ALL');
    setFormOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!categoryId || !question.trim() || !answer.trim()) {
      alert('폴더, 질문, 답변을 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    const res = await adminUpsertFaq({
      id: editFaq?.id,
      category_id: categoryId,
      question,
      answer,
      sort_order: sortOrder,
      answer_format: 'markdown',
      target_role: targetRole,
    });
    setSaving(false);
    if (res.success) {
      setFormOpen(false);
      reload();
    } else alert(res.error);
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const res = await adminUpsertFaqCategory({ name, sort_order: categories.length + 1 });
    if (res.success) {
      setNewCatName('');
      reload();
    } else alert(res.error);
  };

  const handleSaveCategory = async (id: string) => {
    const name = editingCatName.trim();
    if (!name) return;
    const cat = categories.find((c) => c.id === id);
    const res = await adminUpsertFaqCategory({
      id,
      name,
      sort_order: cat?.sort_order ?? 0,
    });
    if (res.success) {
      setEditingCatId(null);
      reload();
    } else alert(res.error);
  };

  return (
    <div className="space-y-6">
      {/* 카테고리(폴더) 관리 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-black text-[15px] text-gray-900 flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-primary" />
          FAQ 항목(폴더) 관리
        </h3>
        <p className="text-[12px] text-gray-500 mt-1 mb-4">
          이용 안내, 포인트·결제 등 고객센터 FAQ 탭에 표시되는 분류입니다.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {sortedCategories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-gray-50 border border-gray-200 rounded-full"
            >
              <GripVertical className="w-3 h-3 text-gray-300" />
              {editingCatId === c.id ? (
                <>
                  <input
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="w-28 px-2 py-0.5 text-[12px] border rounded"
                  />
                  <button
                    type="button"
                    className="text-[11px] font-bold text-primary px-2"
                    onClick={() => handleSaveCategory(c.id)}
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[13px] font-bold text-gray-800">{c.name}</span>
                  <span className="text-[10px] text-gray-400 ml-1">({faqsByCategory.get(c.id)?.length ?? 0})</span>
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-primary"
                    onClick={() => {
                      setEditingCatId(c.id);
                      setEditingCatName(c.name);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-600"
                    onClick={async () => {
                      if (!confirm(`「${c.name}」 항목을 삭제할까요? FAQ가 있으면 삭제되지 않습니다.`)) return;
                      const res = await adminDeleteFaqCategory(c.id);
                      if (res.success) reload();
                      else alert(res.error);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="새 항목 이름 (예: 결제/환불)"
            className="flex-1 max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-[13px]"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2 bg-gray-900 text-white text-[12px] font-black rounded-lg"
          >
            항목 추가
          </button>
        </div>
      </div>

      {/* FAQ 작성 */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-[15px] text-gray-900">FAQ 글 관리</h3>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-[13px] font-black rounded-xl"
        >
          + FAQ 작성
        </button>
      </div>

      {formOpen && (
        <div className="bg-white rounded-2xl border-2 border-primary/20 p-5 space-y-4 shadow-sm">
          <h4 className="font-black text-gray-900">{editFaq ? 'FAQ 수정' : 'FAQ 등록'}</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-[12px] font-bold text-gray-600">폴더(항목) *</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full h-10 px-3 border border-gray-200 rounded-lg text-[13px] font-bold"
              >
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            
            <label className="block">
              <span className="text-[12px] font-bold text-gray-600">노출 권한 *</span>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as 'ALL' | 'EMPLOYER' | 'GENERAL')}
                className="mt-1 w-full h-10 px-3 border border-orange-200 bg-orange-50 text-primary rounded-lg text-[13px] font-bold"
              >
                <option value="ALL">전체 공개 (ALL)</option>
                <option value="EMPLOYER">업체 회원 전용 (EMPLOYER)</option>
                <option value="GENERAL">일반 회원 전용 (GENERAL)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[12px] font-bold text-gray-600">정렬 순서</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full h-10 px-3 border border-gray-200 rounded-lg text-[13px]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[12px] font-bold text-gray-600">질문 *</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-bold"
              placeholder="예: 회원가입은 어떻게 하나요?"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-bold text-gray-600">답변 (Markdown) *</span>
            <div className="mt-1">
              <MarkdownFaqEditor value={answer} onChange={setAnswer} />
            </div>
          </label>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveFaq}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-black disabled:opacity-50"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* FAQ 목록 (폴더별) */}
      {sortedCategories.map((c) => {
        const list = faqsByCategory.get(c.id) || [];
        if (!list.length) return null;
        return (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-black text-[13px] text-gray-700">{c.name}</div>
            <div className="divide-y">
              {list.map((f) => (
                <div key={f.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">{f.question}</p>
                    <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 font-mono">{f.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" className="text-[12px] font-bold text-primary" onClick={() => openEdit(f)}>
                      수정
                    </button>
                    <button
                      type="button"
                      className="text-[12px] font-bold text-red-600"
                      onClick={async () => {
                        if (!confirm('삭제할까요?')) return;
                        const res = await adminDeleteFaq(f.id);
                        if (res.success) reload();
                        else alert(res.error);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
