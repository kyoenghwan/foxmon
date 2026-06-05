'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface AdminRefreshButtonProps {
    onClick?: () => Promise<void> | void;
    className?: string;
}

export function AdminRefreshButton({ onClick, className = '' }: AdminRefreshButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            if (onClick) {
                await onClick();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("❌ [AdminRefreshButton] 리프레시 실패:", err);
        } finally {
            // 자연스러운 회전 효과 유지를 위해 500ms 후 스핀 종료
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            className={`flex items-center justify-center p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all shadow-sm rounded-xl disabled:opacity-70 ${className}`}
            title="데이터 새로고침"
            type="button"
        >
            <RefreshCw 
                size={16} 
                className={`transition-transform duration-500 ${loading ? 'animate-spin' : 'hover:rotate-180'}`} 
            />
        </button>
    );
}
