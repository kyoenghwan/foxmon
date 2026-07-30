'use client';

import React from 'react';
import { Pencil } from 'lucide-react';

export function EditLinkedAdButton({ className, iconSize = "w-3.5 h-3.5" }: { className?: string; iconSize?: string }) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        alert('이 공고는 광고와 연동되어 자동 관리되는 글입니다.\n광고 관리 탭에서 수정해 주세요.');
    };

    return (
        <button
            onClick={handleClick}
            className={className || "p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"}
            title="광고 연동으로 수정 불가"
        >
            <Pencil className={`${iconSize} text-gray-400`} />
        </button>
    );
}
