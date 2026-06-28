'use client';

import React from 'react';

export function OpenMyPageButton() {
    const handleOpen = () => {
        window.dispatchEvent(new CustomEvent('open_settings_modal'));
    };

    return (
        <button
            onClick={handleOpen}
            className="px-6 py-3 bg-primary text-white font-black text-[13px] rounded-xl hover:bg-orange-600 transition-all shadow-md active:scale-95 text-center cursor-pointer"
        >
            마이페이지에서 사업자 인증하기
        </button>
    );
}
