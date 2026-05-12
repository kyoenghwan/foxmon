import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function AdminSupportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    고객센터
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    유저들의 1:1 문의 내역을 확인하고 답변을 작성할 수 있습니다. (개발 중)
                </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-primary/60" />
                </div>
                <div>
                    <h3 className="font-black text-lg text-gray-800">기능 준비 중입니다</h3>
                    <p className="text-[13px] font-medium text-gray-500 mt-1">
                        1:1 문의 관리 기능은 현재 DB 연동 및 개발 진행 중입니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
