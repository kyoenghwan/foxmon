'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { manageAdAction } from '@/lib/actions';

export function ToggleJobStatusButton({ adId, initialStatus }: { adId: string, initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);

    const toggleStatus = async () => {
        setLoading(true);
        const newStatus = status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
        const res = await manageAdAction('UPDATE', { id: adId, status: newStatus } as any);
        if (res.success) {
            setStatus(newStatus);
        } else {
            alert('상태 변경 실패');
        }
        setLoading(false);
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleStatus} 
            disabled={loading}
            className={`text-xs h-8 px-2 ${status === 'COMPLETED' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500'}`}
        >
            {status === 'COMPLETED' ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> 구인완료</>
            ) : (
                <><Circle className="w-3 h-3 mr-1" /> 구인중</>
            )}
        </Button>
    );
}
