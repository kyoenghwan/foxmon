'use client';

import { useState } from 'react';
import { X, Send, ImagePlus } from 'lucide-react';
import { createCommunityPost } from '@/lib/actions/community';
import { nvLog } from '@/lib/logger';

interface WritePostModalProps {
    boardId: string;
    boardLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function WritePostModal({ boardId, boardLabel, isOpen, onClose, onSuccess }: WritePostModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isFoxmarket = boardId === 'foxmarket';
    const isReport = boardId === 'report';

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        nvLog('FW', `${boardLabel} 글쓰기 제출`, { boardId, title });

        try {
            const result = await createCommunityPost({
                board_id: boardId,
                title,
                content,
                thumbnail: isFoxmarket ? thumbnail : null,
                price: isFoxmarket ? price : null,
            });

            if (result.success) {
                setTitle('');
                setContent('');
                setThumbnail('');
                setPrice('');
                onSuccess();
                onClose();
            } else {
                setError(result.message || '등록에 실패했습니다.');
            }
        } catch (err) {
            setError('시스템 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">글쓰기</h3>
                        <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {boardLabel}
                            {isReport && ' · 작성자명이 익명으로 표시됩니다'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* 제목 */}
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="제목을 입력해주세요"
                            maxLength={100}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-primary transition-colors"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-right">{title.length}/100</p>
                    </div>

                    {/* 폭스중고 전용: 대표 이미지 + 가격 */}
                    {isFoxmarket && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">
                                    대표 이미지 URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={thumbnail}
                                        onChange={e => setThumbnail(e.target.value)}
                                        placeholder="이미지 URL 입력"
                                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">
                                    가격
                                </label>
                                <input
                                    type="text"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="예: 50,000원"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* 내용 */}
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">
                            내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="내용을 입력해주세요"
                            rows={10}
                            maxLength={10000}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-primary resize-none leading-relaxed"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-right">{content.length}/10,000</p>
                    </div>

                    {/* 익명 안내 */}
                    {isReport && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-[12px] text-yellow-800 font-medium">
                            🔒 이 게시판의 모든 글은 <strong>익명</strong>으로 등록됩니다. 안심하고 제보해주세요.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-[14px] rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title.trim() || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
