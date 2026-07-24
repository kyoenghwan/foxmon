'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

const GlobalAlertContext = createContext<(message: string) => void>(() => {});

export const useGlobalAlert = () => useContext(GlobalAlertContext);

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const showAlert = (msg: string) => {
        setMessage(msg);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setMessage('');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 브라우저 기본 alert를 커스텀 alert로 덮어씌웁니다.
            window.alert = (msg: string) => {
                showAlert(String(msg));
            };
        }
    }, []);

    return (
        <GlobalAlertContext.Provider value={showAlert}>
            {children}
            
            {/* 전역 정중앙 커스텀 알럿 모달 */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                        {/* 폭스몬 🦊 마스코트 이모지 */}
                        <div className="w-12 h-12 bg-orange-50 text-orange-650 rounded-full flex items-center justify-center text-2xl font-black mb-3">
                            🦊
                        </div>
                        <h4 className="font-black text-[15px] text-gray-900">폭스몬 안내</h4>
                        <p className="text-[13px] text-gray-600 mt-2.5 font-semibold leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="mt-5 w-full h-11 bg-orange-600 hover:bg-orange-700 text-white text-[13px] font-black rounded-xl shadow active:scale-95 transition-all"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </GlobalAlertContext.Provider>
    );
}
