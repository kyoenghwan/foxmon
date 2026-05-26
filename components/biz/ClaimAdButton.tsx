'use client';

import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { ClaimAdModal } from './ClaimAdModal';

export function ClaimAdButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-200 hover:border-primary/30 hover:bg-orange-50/20 text-gray-700 font-black text-[13px] sm:text-[14px] rounded-xl transition-all shadow-xs active:scale-95 shrink-0"
            >
                <Key className="w-4 h-4 text-gray-400" />
                대행 광고 가져오기
            </button>

            <ClaimAdModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
