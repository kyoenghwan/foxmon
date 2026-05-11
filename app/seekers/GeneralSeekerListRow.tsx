'use client';

import Link from 'next/link';

export function GeneralSeekerListRow({ job }: { job: any }) {
    const { ad_title, resumes } = job;
    const { desired_location, nickname, gender, title } = resumes || {};
    
    // 지역 축약
    const shortLocation = desired_location?.split(' ').slice(0, 2).join(' ') || '지역무관';
    
    const displayTitle = ad_title || title || '구직 중입니다.';
    const displayNickname = nickname || '익명 구직자';
    const displayGender = gender === 'M' ? '남성' : gender === 'F' ? '여성' : '성별무관';

    return (
        <Link href="#" className="block w-full border-b border-gray-100 bg-white hover:bg-gray-50/80 transition-colors p-4 md:px-6 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                {/* 1. 좌측 (모바일: 지역 - 닉네임) / (PC: 지역) */}
                <div className="flex items-center justify-between md:w-[130px] md:shrink-0 md:justify-start">
                    <span className="text-[12px] md:text-[13px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] border border-gray-200">
                        {shortLocation}
                    </span>
                    <span className="text-[12px] text-gray-400 font-medium md:hidden truncate max-w-[100px]">
                        {displayNickname}
                    </span>
                </div>

                {/* 2. 중앙 내용 (제목) */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="truncate w-full mt-0.5">
                        <span className="text-[15px] md:text-[16px] truncate tracking-tight font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {displayTitle}
                        </span>
                    </div>
                </div>

                {/* 3. 우측 (모바일: 닉네임 크게) / (PC: 닉네임 + 성별) */}
                <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center md:w-[150px] shrink-0 gap-1 mt-1 md:mt-0">
                    <span className="text-[13px] md:text-[12px] text-gray-400 font-medium hidden md:block truncate max-w-[130px]">
                        {displayNickname}
                    </span>
                    <span className="text-[14px] md:text-[15px] font-bold text-gray-700 tracking-tighter">
                        {displayGender}
                    </span>
                </div>
            </div>
        </Link>
    );
}
