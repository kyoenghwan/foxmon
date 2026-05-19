'use client';

import { useState, useEffect } from 'react';
import { getPolicy, updatePolicy } from '@/lib/actions/policies';
import { toast } from 'sonner';

type PolicyType = 'ABOUT' | 'TERMS' | 'PRIVACY' | 'YOUTH';

const POLICY_TABS: { id: PolicyType; label: string }[] = [
    { id: 'ABOUT', label: '회사소개' },
    { id: 'TERMS', label: '이용약관' },
    { id: 'PRIVACY', label: '개인정보처리방침' },
    { id: 'YOUTH', label: '청소년보호정책' }
];

export default function PoliciesAdminPage() {
    const [activeTab, setActiveTab] = useState<PolicyType>('ABOUT');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPolicy(activeTab);
    }, [activeTab]);

    const loadPolicy = async (type: PolicyType) => {
        setIsLoading(true);
        try {
            const data = await getPolicy(type);
            setContent(data);
        } catch (error) {
            toast.error('약관 내용을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updatePolicy(activeTab, content);
            if (result.success) {
                toast.success('성공적으로 저장되었습니다.');
            } else {
                toast.error(result.error || '저장에 실패했습니다.');
            }
        } catch (error) {
            toast.error('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">약관 및 정책 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">사이트 하단(Footer)에 표시되는 각종 약관을 수정할 수 있습니다.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    {POLICY_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-primary border-b-2 border-primary'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Editor */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-semibold text-gray-700">
                            {POLICY_TABS.find(t => t.id === activeTab)?.label} 내용
                        </label>
                        <span className="text-xs text-gray-400">HTML 태그 사용 가능</span>
                    </div>
                    
                    <div className="relative">
                        {isLoading ? (
                            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed resize-none"
                                placeholder={`${POLICY_TABS.find(t => t.id === activeTab)?.label} 내용을 입력해주세요...`}
                            />
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isLoading || isSaving}
                            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                '저장하기'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
