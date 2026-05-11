'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPolicy, updatePolicy } from '@/actions/admin/policies';
import { Loader2, Save } from 'lucide-react';

export default function PoliciesAdminPage() {
    const [policyType, setPolicyType] = useState('resume_privacy');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchPolicy() {
            setIsLoading(true);
            try {
                const data = await getPolicy(policyType);
                if (data) {
                    setTitle(data.title);
                    setContent(data.content);
                } else {
                    setTitle('이력서 개인정보 수집 및 이용 동의');
                    setContent('');
                }
            } catch (err) {
                console.error("Failed to load policy", err);
            }
            setIsLoading(false);
        }
        fetchPolicy();
    }, [policyType]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePolicy(policyType, title, content, true);
            alert('정책이 성공적으로 저장되었습니다.');
        } catch (err: any) {
            alert('저장 중 오류가 발생했습니다: ' + err.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">정책 및 약관 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">이력서 등록 개인정보 동의 등 시스템 텍스트를 관리합니다.</p>
                </div>
            </div>

            <Card className="p-6">
                <div className="flex flex-col gap-6">
                    <div className="flex gap-2">
                        <select 
                            className="p-2 border rounded-md font-bold text-sm bg-gray-50"
                            value={policyType}
                            onChange={(e) => setPolicyType(e.target.value)}
                        >
                            <option value="resume_privacy">이력서 개인정보 동의</option>
                            <option value="terms_of_service">이용약관 (추후 추가용)</option>
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">정책 제목</label>
                                <Input 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="예: 이력서 개인정보 수집 및 이용 동의" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">정책 본문 내용</label>
                                <textarea
                                    className="w-full h-[400px] p-4 border rounded-lg text-[13px] leading-relaxed resize-y font-mono bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="개인정보 수집 및 이용 동의 내용을 입력하세요..."
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="font-bold flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    변경사항 저장
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
