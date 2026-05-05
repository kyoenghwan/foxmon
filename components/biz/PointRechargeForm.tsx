'use client';

import { useState } from 'react';
import { requestPointRecharge } from '@/lib/actions';

export function PointRechargeForm() {
    const [amount, setAmount] = useState('');
    const [depositorName, setDepositorName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || !depositorName.trim()) {
            alert('충전 금액과 입금자명을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestPointRecharge({
                amount: parseInt(amount, 10),
                depositor_name: depositorName
            });

            if (res.success) {
                alert('충전 신청이 완료되었습니다.\n담당자 확인 후 1영업일 이내 포인트가 지급됩니다.');
                setAmount('');
                setDepositorName('');
            } else {
                alert(`신청 실패: ${res.message}`);
            }
        } catch (error) {
            console.error('충전 신청 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">충전 금액 (원)</label>
                    <select 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary font-medium"
                    >
                        <option value="">금액 선택</option>
                        <option value="100000">100,000원 (100,000P)</option>
                        <option value="300000">300,000원 (300,000P + 보너스 15,000P)</option>
                        <option value="500000">500,000원 (500,000P + 보너스 50,000P)</option>
                        <option value="1000000">1,000,000원 (1,000,000P + 보너스 150,000P)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">입금자명</label>
                    <input
                        type="text"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                        placeholder="실제 입금하실 이름을 입력해주세요"
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md disabled:bg-gray-300"
            >
                {isSubmitting ? '신청 중...' : '충전 신청하기'}
            </button>
        </form>
    );
}
