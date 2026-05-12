'use client';

import { useRouter } from 'next/navigation';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { manageBizAdAction } from '@/lib/actions';

export default function EditAdForm({ initialData, adId }: { initialData: any, adId: string }) {
    const router = useRouter();

    const handleSubmit = async (data: AdFormData) => {
        try {
            // 수정 시에는 기존 _isDraft나 _isPayment 플래그 등은 유지하되, 내용만 업데이트
            // 이미 결제가 된 광고라도 수정 창에서는 내용만 수정함.
            const res = await manageBizAdAction('UPDATE', { ...data, _isDraft: true }, adId);
            if (res.success) {
                alert('광고가 성공적으로 수정되었습니다.');
                router.refresh();
            } else {
                alert('수정에 실패했습니다: ' + res.message);
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center gap-4">
                <Link href="/biz/ads" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h2 className="text-xl font-black text-gray-900">광고 수정</h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                        배너 정보와 상세 공고 내용을 수정할 수 있습니다.
                    </p>
                </div>
            </div>

            <AdEditorForm initialData={initialData} onSubmit={handleSubmit} />
        </div>
    );
}
