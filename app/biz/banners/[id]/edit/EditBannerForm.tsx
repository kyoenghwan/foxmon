'use client';

import { useRouter } from 'next/navigation';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { manageBizAdAction } from '@/lib/actions';
import { MobileBlockNotice } from '@/components/biz/MobileBlockNotice';

export default function EditBannerForm({ initialData, adId }: { initialData: any, adId: string }) {
    const router = useRouter();

    const handleSubmit = async (data: AdFormData) => {
        try {
            // 배너 수정 시에는 _isDraft를 유지하여 임시저장(배너) 상태를 지속합니다.
            const res = await manageBizAdAction('UPDATE', { ...data, _isDraft: true }, adId);
            if (res.success) {
                alert('배너 디자인 및 공고 요강이 수정되었습니다.');
                router.push('/biz/banners');
            } else {
                alert('수정에 실패했습니다: ' + res.message);
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <MobileBlockNotice title="배너 수정은 PC에서만 가능합니다" />
            <div className="hidden md:block space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-center gap-4">
                    <Link href="/biz/banners" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">배너 디자인 수정</h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                            배너의 비주얼 및 상세 구인요강 내용을 수정할 수 있습니다.
                        </p>
                    </div>
                </div>

                <AdEditorForm initialData={initialData} onSubmit={handleSubmit} />
            </div>
        </>
    );
}
