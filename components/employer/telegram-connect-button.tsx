'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface TelegramConnectButtonProps {
    userId: string;
    botUsername: string;
    isLinked?: boolean;
}

export function TelegramConnectButton({ userId, botUsername, isLinked = false }: TelegramConnectButtonProps) {
    const handleConnect = () => {
        if (!botUsername) {
            alert('관리자가 아직 텔레그램 봇을 설정하지 않았습니다.');
            return;
        }
        
        // 텔레그램 딥링크 생성 (t.me/봇아이디?start=유저ID)
        const botIdWithoutAt = botUsername.startsWith('@') ? botUsername.substring(1) : botUsername;
        const telegramUrl = `https://t.me/${botIdWithoutAt}?start=${userId}`;
        
        window.open(telegramUrl, '_blank');
    };

    return (
        <div className="bg-[#2AABEE]/10 border border-[#2AABEE]/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h4 className="text-[15px] font-bold text-[#2AABEE] flex items-center gap-2 mb-1">
                    <Send className="w-5 h-5" /> 텔레그램 실시간 알림 연동
                </h4>
                <p className="text-[13px] text-gray-600 font-medium">
                    {isLinked 
                        ? '현재 텔레그램 알림이 연동되어 있습니다. 새로운 지원자 알림을 텔레그램으로 받습니다.' 
                        : '연동하기 버튼을 누르고 텔레그램에서 "시작"을 누르시면, 새로운 지원자 알림을 실시간으로 받을 수 있습니다.'}
                </p>
            </div>
            <Button 
                onClick={handleConnect}
                className="w-full sm:w-auto bg-[#2AABEE] hover:bg-[#2298D6] text-white font-bold h-11 px-6 shadow-md transition-transform active:scale-95 shrink-0"
            >
                {isLinked ? '텔레그램 봇 열기' : '텔레그램 연동하기'}
            </Button>
        </div>
    );
}
