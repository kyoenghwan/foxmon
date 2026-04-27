'use client';

import { useRouter } from 'next/navigation';
import { AdEditorForm, AdFormData } from '@/components/biz/AdEditorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAdPage() {
    const router = useRouter();

    const handleSubmit = async (data: AdFormData) => {
        // 추후 FA_AD_CRUD_FLOW 연동 예정
        console.log('구인 공고 등록 데이터:', data);
        alert('구인 공고가 등록되었습니다!');
        router.push('/biz/jobs');
    };

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center gap-4">
                <Link href="/biz/jobs" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h2 className="text-xl font-black text-gray-900">새 구인 공고 등록</h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                        공고 상세 내용을 작성해주세요.
                    </p>
                </div>
            </div>

            <AdEditorForm isNew mode="JOB" onSubmit={handleSubmit} />
        </div>
    );
}
