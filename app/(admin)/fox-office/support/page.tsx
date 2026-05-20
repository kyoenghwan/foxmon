import React from 'react';
import Link from 'next/link';
import { HelpCircle, ShieldCheck, Headset } from 'lucide-react';

export default function AdminSupportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    고객센터
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    고객센터 메신저 관리(인박스) 및 담당자/권한 관리를 수행합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/fox-office/help"
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-gray-900 text-[16px]">공지·FAQ·1:1 문의</h3>
                            <p className="text-[13px] font-medium text-gray-500 mt-1">
                                고객센터(/help) 공지사항, FAQ, 문의 답변 관리
                            </p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/fox-office/support/staff"
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-gray-900 text-[16px]">고객센터 관리</h3>
                            <p className="text-[13px] font-medium text-gray-500 mt-1">
                                담당자·업무시간·자동 응답·키워드 봇을 설정합니다.
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/fox-office/support/inbox"
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                            <Headset className="w-6 h-6 text-primary/70" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-gray-900 text-[16px]">메신저 관리(인박스)</h3>
                            <p className="text-[13px] font-medium text-gray-500 mt-1">
                                고객 문의 목록 확인 · 답변 (실시간 반영)
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
