"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/src/components/auth/LoginForm';
import { UserCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
    const router = useRouter();
    
    return (
        <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">
                {/* Fixed Close Button - Inside the card, top right */}
                <button 
                    onClick={() => router.push('/')}
                    className="absolute top-8 right-8 z-50 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all active:scale-95"
                    title="닫기"
                >
                    <X className="w-7 h-7 stroke-[2.5]" />
                </button>
            {/* Brand Header (Sync with RegisterForm) */}
            <div className="bg-gradient-to-b from-purple-100 via-purple-50/50 to-white px-8 pt-12 pb-10 flex flex-col items-center gap-2 border-b border-gray-100 relative overflow-hidden">
                {/* Decorative Ambient Color Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <h1 className="text-[40px] font-extrabold tracking-tighter text-purple-900 italic relative z-10 drop-shadow-sm">FOXMON</h1>
                <p className="text-purple-600 text-[12px] font-black tracking-widest uppercase relative z-10">신뢰할 수 있는 구인구직</p>
            </div>

            <div className="p-8 md:p-12 space-y-10">
                {/* Content Area */}
                <div className="min-h-[300px]">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-6 bg-purple-600 rounded-full shadow-sm shadow-purple-600/20" />
                            <h2 className="text-xl font-black text-purple-900 italic tracking-tight">회원로그인</h2>
                        </div>
                        <LoginForm />
                    </div>
                </div>

                {/* Footer and Links - Removed duplicate links as they are now handled inside LoginForm */}
            </div>
        </div>
    </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-20 font-bold">로딩 중...</div>}>
            <LoginContent />
        </Suspense>
    );
}
