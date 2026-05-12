import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function AdminCommunityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    커뮤니티 관리
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    유저들이 작성한 게시글과 댓글을 모니터링하고 제재할 수 있습니다. (개발 중)
                </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-primary/60" />
                </div>
                <div>
                    <h3 className="font-black text-lg text-gray-800">기능 준비 중입니다</h3>
                    <p className="text-[13px] font-medium text-gray-500 mt-1">
                        커뮤니티 게시판 모니터링 기능은 현재 DB 연동 및 개발 진행 중입니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
