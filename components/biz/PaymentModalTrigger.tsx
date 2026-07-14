'use client';

import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { JobPaymentModal } from './JobPaymentModal';
import { useRouter } from 'next/navigation';

export function PaymentModalTrigger({ ad }: { ad: any }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <button 
                onClick={() => setOpen(true)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[12px] font-black hover:bg-black transition-colors whitespace-nowrap"
                title="연장 및 옵션 결제"
            >
                <CreditCard className="w-3.5 h-3.5" /> 결제
            </button>
            
            {open && (
                <JobPaymentModal 
                    initialData={ad} 
                    jobId={ad.id} 
                    onClose={() => setOpen(false)} 
                    onSuccess={() => {
                        setOpen(false);
                        router.refresh();
                    }} 
                />
            )}
        </>
    );
}
