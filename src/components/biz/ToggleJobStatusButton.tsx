'use client';
import { useState } from 'react';
import { manageAdAction } from '@/lib/actions';

export function ToggleJobStatusButton({ adId, initialStatus }: { adId: string, initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true);
        const res = await manageAdAction('UPDATE', { id: adId, status: newStatus } as any);
        if (res.success) {
            setStatus(newStatus);
        } else {
            alert('상태 변경 실패');
        }
        setLoading(false);
    };

    return (
        <select
            value={status}
            disabled={loading}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-[12px] font-black rounded-lg border-2 px-2 py-1 outline-none cursor-pointer transition-all ${
                status === 'COMPLETED' 
                    ? 'bg-gray-800 text-white border-gray-900' 
                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70'
            }`}
        >
            <option value="ACTIVE" className="bg-white text-gray-800 font-bold">구인중</option>
            <option value="COMPLETED" className="bg-white text-gray-800 font-bold">구인완료</option>
        </select>
    );
}
