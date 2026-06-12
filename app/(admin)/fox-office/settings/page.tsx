"use client";

import React, { useState, useEffect } from 'react';
import { Save, Key, AlertCircle, Loader2, Eye, EyeOff, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSiteSettings, updateSiteSettings } from '@/actions/admin/siteSettings';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        openai_api_key: '',
        telegram_bot_token: '',
        telegram_bot_username: '',
        bank_name: '',
        account_number: '',
        account_holder: ''
    });
    
    // Toggle States for passwords
    const [showApiKey, setShowApiKey] = useState(false);
    const [showTelegramToken, setShowTelegramToken] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, success } = await getSiteSettings();
            if (success && data) {
                setSettings({
                    openai_api_key: data.openai_api_key || '',
                    telegram_bot_token: data.telegram_bot_token || '',
                    telegram_bot_username: data.telegram_bot_username || '',
                    bank_name: data.bank_name || '',
                    account_number: data.account_number || '',
                    account_holder: data.account_holder || ''
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
                        <div className="relative">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={settings.openai_api_key}
                                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                                placeholder="sk-..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-tight pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-start gap-1 mt-2">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            AI 로고 자동 생성 및 이미지 생성을 위한 API 키를 입력하세요. 이 키는 클라이언트에 절대 노출되지 않으며 서버 엑션에서만 안전하게 사용됩니다.
                        </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Telegram Bot Token 설정 */}
                    <div>
                        <label className="block text-[14px] font-bold text-gray-800 mb-2">Telegram Bot Token & Username</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={settings.telegram_bot_username}
                                onChange={(e) => setSettings({ ...settings, telegram_bot_username: e.target.value })}
                                placeholder="봇 아이디 (예: @foxmon_alert_bot)"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-tight"
                            />
                            <div className="relative">
                                <input
                                    type={showTelegramToken ? "text" : "password"}
                                    value={settings.telegram_bot_token}
                                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                                    placeholder="HTTP API Token (예: 123456789:ABCdefGHI...)"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-tight pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-start gap-1 mt-2">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            텔레그램 BotFather에서 발급받은 봇 아이디와 토큰을 입력하세요. 사장님 푸시 알림 전송에 사용됩니다.
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

            {/* 무통장 입금 계좌 설정 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-gray-700" />
                    <h2 className="text-[16px] font-bold text-gray-800">무통장 입금 계좌 설정</h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 은행명 */}
                        <div>
                            <label className="block text-[14px] font-bold text-gray-800 mb-2">은행명</label>
                            <input
                                type="text"
                                value={settings.bank_name}
                                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                                placeholder="예: 국민은행"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>
                        {/* 계좌번호 */}
                        <div>
                            <label className="block text-[14px] font-bold text-gray-800 mb-2">계좌번호</label>
                            <input
                                type="text"
                                value={settings.account_number}
                                onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                                placeholder="예: 123456-78-901234"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>
                        {/* 예금주 */}
                        <div>
                            <label className="block text-[14px] font-bold text-gray-800 mb-2">예금주</label>
                            <input
                                type="text"
                                value={settings.account_holder}
                                onChange={(e) => setSettings({ ...settings, account_holder: e.target.value })}
                                placeholder="예: 폭스몬 주식회사"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>
                    </div>
                    <p className="text-[12px] text-gray-500 flex items-start gap-1 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        사업자 회원이 포인트 충전 신청을 할 때 입금할 무통장 계좌 정보를 설정합니다.
                    </p>
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
