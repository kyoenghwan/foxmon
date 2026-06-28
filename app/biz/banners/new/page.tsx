'use client';

import { useRouter } from 'next/navigation';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { manageBizAdAction } from '@/lib/actions';
import { MobileBlockNotice } from '@/components/biz/MobileBlockNotice';

export default function NewBannerPage() {
    const router = useRouter();

    const handleSubmit = async (data: AdFormData) => {
        try {
            // 배너 제작 탭에서는 무조건 Draft(임시저장 배너 템플릿)로 저장
            const res = await manageBizAdAction('CREATE', { ...data, _isDraft: true });
            if (res.success) {
                alert('새 배너 디자인이 저장되었습니다! 광고 대시보드나 배너 관리 목록에서 확인하실 수 있습니다.');
                router.push('/biz/banners');
            } else {
                alert('배너 등록에 실패했습니다: ' + res.message);
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <MobileBlockNotice />
            <div className="hidden md:block space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-center gap-4">
                    <Link href="/biz/banners" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">새 배너 제작</h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                            광고 배너의 외형 및 상세 구인 요강을 작성하여 임시 배너 템플릿으로 보관합니다.
                        </p>
                    </div>
                </div>

                <AdEditorForm isNew onSubmit={handleSubmit} />
            </div>
        </>
    );
}
