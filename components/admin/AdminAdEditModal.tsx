'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { adminUpdateAdAction } from '@/lib/actions/admin-ad-actions';

interface AdminAdEditModalProps {
    ad: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function AdminAdEditModal({ ad, onClose, onSuccess }: AdminAdEditModalProps) {
    const [title, setTitle] = useState(ad.title || '');
    const [companyName, setCompanyName] = useState(ad.company_name || ad.company || '');
    const [salaryType, setSalaryType] = useState(ad.salary_type || '시급');
    const [salaryAmount, setSalaryAmount] = useState(ad.salary_amount || ad.pay || '');
    const [tier, setTier] = useState(ad.tier || 'GENERAL');
    const [status, setStatus] = useState(ad.status || 'ACTIVE');
    
    // 만료일 (YYYY-MM-DDThh:mm)
    const initialExpires = ad.expires_at && new Date(ad.expires_at).getFullYear() !== 2000
        ? new Date(ad.expires_at).toISOString().slice(0, 16)
        : '';
    const [expiresAt, setExpiresAt] = useState(initialExpires);

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatePayload: any = {
                title,
                company_name: companyName,
                salary_type: salaryType,
                salary_amount: salaryAmount,
                pay: `[${salaryType}] ${salaryAmount}`,
                tier,
                status,
            };

            if (expiresAt) {
                updatePayload.expires_at = new Date(expiresAt).toISOString();
            }

            const isJob = ad.is_job || false;
            const res = await adminUpdateAdAction(ad.id, updatePayload, isJob);

            if (res.success) {
                alert('광고 정보가 성공적으로 수정되었습니다.');
                onSuccess();
                onClose();
            } else {
                alert(res.message || '수정 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert('오류 발생: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <span>🛠️</span> 관리자 권한 광고/공고 수정
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">공고 제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">업체명</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">광고 상태</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            >
                                <option value="ACTIVE">ACTIVE (노출중)</option>
                                <option value="PAUSED">PAUSED (중지/대기)</option>
                                <option value="EXPIRED">EXPIRED (만료)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">급여 형태</label>
                            <input
                                type="text"
                                value={salaryType}
                                onChange={(e) => setSalaryType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">급여액</label>
                            <input
                                type="text"
                                value={salaryAmount}
                                onChange={(e) => setSalaryAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">광고 티어</label>
                            <select
                                value={tier}
                                onChange={(e) => setTier(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            >
                                <option value="PREMIUM_MAIN">메인 배너 (PREMIUM_MAIN)</option>
                                <option value="SIDE">사이드 배너 (SIDE)</option>
                                <option value="PREMIUM">프리미엄 (PREMIUM)</option>
                                <option value="SPECIAL">스페셜 (SPECIAL)</option>
                                <option value="AD_GENERAL">일반 배너 (AD_GENERAL)</option>
                                <option value="GENERAL">일반 구인글 (GENERAL)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">노출 만료일시</label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? '저장 중...' : '변경사항 저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
