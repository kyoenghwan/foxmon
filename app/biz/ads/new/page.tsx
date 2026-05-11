'use client';

import { useRouter } from 'next/navigation';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { manageAdAction } from '@/lib/actions';

export default function NewAdPage() {
    const router = useRouter();

    const handleSubmit = async (data: AdFormData) => {
        try {
            const res = await manageAdAction('CREATE', data);
            if (res.success) {
                alert('광고가 등록되었습니다!');
                router.push('/biz/ads');
            } else {
                alert('등록에 실패했습니다: ' + res.message);
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
                    <h2 className="text-xl font-black text-gray-900">새 광고 등록</h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                        배너 정보와 상세 공고 내용을 작성해주세요.
                    </p>
                </div>
            </div>

            <AdEditorForm isNew onSubmit={handleSubmit} />
        </div>
    );
}
