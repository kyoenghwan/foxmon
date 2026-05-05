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
                className="p-2 hover:bg-orange-50 rounded-lg transition-colors group" 
                title="연장 및 옵션 결제"
            >
                <CreditCard className="w-4 h-4 text-orange-400 group-hover:text-orange-600" />
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
