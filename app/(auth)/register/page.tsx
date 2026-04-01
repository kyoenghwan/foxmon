"use client";

import { Suspense } from 'react';
import { RegisterForm } from '@/src/components/auth/RegisterForm';

function RegisterContent() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 md:py-12 md:p-8 bg-[#f8f9fa]">
            <RegisterForm />
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-bold text-purple-500 animate-pulse">FOXMON...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
