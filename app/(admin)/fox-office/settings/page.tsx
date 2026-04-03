"use client";

import React, { useState, useEffect } from 'react';
import { Save, Key, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSiteSettings, updateSiteSettings } from '@/actions/admin/siteSettings';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        openai_api_key: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, success } = await getSiteSettings();
            if (success && data) {
                setSettings({
                    openai_api_key: data.openai_api_key || ''
                });
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { success, error } = await updateSiteSettings(settings);
        setSaving(false);

        if (success) {
            alert('설정이 저장되었습니다.');
        } else {
            alert('저장에 실패했습니다: ' + error);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">시스템 환경설정</h1>
                <p className="text-gray-500 mt-1">API 키 및 전체 서비스 운영 환경을 설정합니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                    <Key className="w-5 h-5 text-gray-700" />
                    <h2 className="text-[16px] font-bold text-gray-800">외부 API 연동 설정</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* OpenAI API Key 설정 */}
                    <div>
                        <label className="block text-[14px] font-bold text-gray-800 mb-2">OpenAI (DALL-E 3) API Key</label>
                        <div className="flex gap-3">
                            <input
                                type="password"
                                value={settings.openai_api_key}
                                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                                placeholder="sk-..."
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none mb-1 focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-tight"
                            />
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            AI 로고 자동 생성 및 이미지 생성을 위한 API 키를 입력하세요. 이 키는 클라이언트에 절대 노출되지 않으며 서버 엑션에서만 안전하게 사용됩니다.
                        </p>
                    </div>

                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 px-6 gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? '저장 중...' : '저장하기'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
