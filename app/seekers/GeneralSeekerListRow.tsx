'use client';

import { useRouter } from 'next/navigation';
import { MarqueeText } from '@/components/ui/marquee-text';

export interface SeekerJobType {
    id: string;
    created_at: string;
    status?: string;
    ad_title?: string;
    resumes?: any;
    users?: any;
    [key: string]: any;
}

export function GeneralSeekerListRow({ job, onClick }: { job: SeekerJobType; onClick?: () => void }) {
    const router = useRouter();
    const { ad_title, created_at, resumes, users } = job;
    const { desired_location, nickname, gender, title, desired_industry, desired_pay_amount, desired_pay_type } = resumes || {};
    
    // 1. 이름 마스킹
    const rawName = nickname || users?.name || '익명';
    const maskedName = rawName.charAt(0) + 'OO';

    // 2. 성별/나이
    const genderKr = gender === 'F' ? '여' : gender === 'M' ? '남' : '무관';
    let ageStr = '';
    const currentYear = new Date().getFullYear();
    
    if (resumes?.birth_year) {
        ageStr = `,${currentYear - resumes.birth_year + 1}`;
    } else if (users?.birth_date && users.birth_date.length >= 4) {
        const birthYear = parseInt(users.birth_date.substring(0, 4));
        ageStr = `,${currentYear - birthYear + 1}`;
    }
    const genderAge = `${genderKr}${ageStr}`;

    // 3. 제목
    const displayTitle = ad_title || title || '구직 중입니다.';

    // 4. 희망지역
    const shortLocation = desired_location?.split(' ').slice(0, 2).join(' ') || '지역무관';

    // 5. 희망업종
    const industry = desired_industry || '무관';

    // 6. 희망급여
    let payText = '면접 후 협의';
    if (desired_pay_amount) {
        const typeStr = desired_pay_type === 'HOURLY' ? '시급' : desired_pay_type === 'DAILY' ? '일급' : '월급';
        payText = `${typeStr} ${desired_pay_amount.toLocaleString()}원`;
    }

    // 7. 신규 여부 판별 (24시간 이내 등록)
    const createdDate = new Date(created_at);
    const now = new Date();
    const isNew = (now.getTime() - createdDate.getTime()) <= 24 * 60 * 60 * 1000;

    const isInactive = job.status === 'INACTIVE';

    return (
        <div 
            onClick={() => {
                if (isInactive) {
                    alert('구직 완료된 구직글입니다.');
                    return;
                }
                if (onClick) onClick();
                else router.push(`/seekers/${job.id}`);
            }}
            className={`p-4 sm:p-5 hover:bg-gray-50/50 active:scale-[0.99] transition-all border border-gray-200/80 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-primary/30 flex flex-col gap-2.5 cursor-pointer relative group ${isInactive ? 'opacity-50 grayscale' : ''}`}
        >
            {/* 1행: [상태 배지] + [원하는 급여] + [제목] */}
            <div className="flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black whitespace-nowrap shrink-0 ${
                        isInactive 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-blue-100 text-blue-600 border border-blue-200'
                    }`}>
                        {isInactive ? '구직 완료' : '구직 중'}
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                        isInactive 
                            ? 'bg-gray-100 text-gray-400 border-gray-200/50' 
                            : 'bg-orange-50 text-orange-600 border-orange-100/50'
                    }`}>
                        {payText}
                    </span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <MarqueeText className="font-extrabold text-[14px] sm:text-[15px] text-gray-800 leading-snug group-hover:text-primary transition-colors text-left">
                            {displayTitle}
                            {isNew && (
                                <span className="text-red-600 font-black text-[12px] ml-1 shrink-0 select-none animate-pulse">N</span>
                            )}
                        </MarqueeText>
                    </div>
                </div>
            </div>
            
            {/* 2행: 이름, 성별/나이 및 메타 정보 */}
            <div className="flex items-center gap-x-2 text-[12px] sm:text-[13px] overflow-hidden w-full">
                <span className="font-extrabold text-gray-900 text-[13px] sm:text-[14px] shrink-0">
                    {maskedName}
                </span>
                <span className="text-gray-300 shrink-0">|</span>
                <span className="font-bold text-gray-600 shrink-0">
                    {genderAge}
                </span>
                <span className="text-gray-300 shrink-0">|</span>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                    <MarqueeText className="font-bold text-gray-500 text-left whitespace-nowrap">
                        📍 {shortLocation} <span className="text-gray-300 mx-1">|</span> 💼 {industry}
                    </MarqueeText>
                </div>
            </div>
        </div>
    );
}

export function GeneralSeekerListRowDesktop({ job, onClick }: { job: SeekerJobType; onClick?: () => void }) {
    const router = useRouter();
    const { ad_title, created_at, resumes, users } = job;
    const { desired_location, nickname, gender, title, desired_industry, desired_pay_amount, desired_pay_type } = resumes || {};
    
    // 1. 이름 마스킹
    const rawName = nickname || users?.name || '익명';
    const maskedName = rawName.charAt(0) + 'OO';

    // 2. 성별/나이
    const genderKr = gender === 'F' ? '여' : gender === 'M' ? '남' : '무관';
    let ageStr = '';
    const currentYear = new Date().getFullYear();
    
    if (resumes?.birth_year) {
        ageStr = `,${currentYear - resumes.birth_year + 1}`;
    } else if (users?.birth_date && users.birth_date.length >= 4) {
        const birthYear = parseInt(users.birth_date.substring(0, 4));
        ageStr = `,${currentYear - birthYear + 1}`;
    }
    const genderAge = `${genderKr}${ageStr}`;

    // 3. 제목
    const displayTitle = ad_title || title || '구직 중입니다.';

    // 4. 희망지역
    const shortLocation = desired_location?.split(' ').slice(0, 2).join(' ') || '지역무관';

    // 5. 희망업종
    const industry = desired_industry || '무관';

    // 6. 희망급여
    let payText = '면접 후 협의';
    if (desired_pay_amount) {
        const typeStr = desired_pay_type === 'HOURLY' ? '시급' : desired_pay_type === 'DAILY' ? '일급' : '월급';
        payText = `${typeStr} ${desired_pay_amount.toLocaleString()}원`;
    }

    // 7. 신규 여부 판별 (24시간 이내 등록)
    const createdDate = new Date(created_at);
    const now = new Date();
    const isNew = (now.getTime() - createdDate.getTime()) <= 24 * 60 * 60 * 1000;

    const isInactive = job.status === 'INACTIVE';

    return (
        <tr 
            onClick={() => {
                if (isInactive) {
                    alert('구직 완료된 구직글입니다.');
                    return;
                }
                if (onClick) onClick();
                else router.push(`/seekers/${job.id}`);
            }}
            className={`hover:bg-gray-50/50 transition-colors group cursor-pointer border-b border-gray-100 ${isInactive ? 'opacity-50 grayscale' : ''}`}
        >
            <td className="py-4 px-2 text-center">
                {isInactive ? (
                    <span className="text-[10px] bg-gray-200 text-gray-600 border border-transparent py-0.5 rounded font-black whitespace-nowrap shrink-0 w-[55px] text-center inline-block">구직 완료</span>
                ) : (
                    <span className="text-[10px] bg-blue-100 text-blue-600 border border-blue-200 py-0.5 rounded font-black whitespace-nowrap shrink-0 w-[55px] text-center inline-block">구직중</span>
                )}
            </td>
            <td className="py-4 px-2 font-bold text-gray-800 text-center">
                <span className="font-bold text-gray-800 shrink-0">{maskedName}</span>
            </td>
            <td className="py-4 px-2 text-gray-600 text-center">{genderAge}</td>
            <td className="py-4 px-4 text-center font-bold text-gray-800 group-hover:text-primary transition-colors max-w-[200px] md:max-w-[300px] overflow-hidden">
                <MarqueeText className="font-bold text-gray-800 text-center">
                    {displayTitle}
                    {isNew && (
                        <span className="text-red-600 font-black text-[12px] ml-1 shrink-0 inline-block animate-pulse">N</span>
                    )}
                </MarqueeText>
            </td>
            <td className="py-4 px-2 text-gray-500 text-center max-w-[150px] overflow-hidden">
                <MarqueeText className="text-gray-500 text-center">
                    {shortLocation}
                </MarqueeText>
            </td>
            <td className="py-4 px-2 text-gray-500 text-center max-w-[150px] overflow-hidden">
                <MarqueeText className="text-gray-500 text-center">
                    {industry}
                </MarqueeText>
            </td>
            <td className="py-4 px-2 text-center">
                <span className="bg-gray-100 text-gray-500 text-[11px] md:text-[12px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    {payText}
                </span>
            </td>
        </tr>
    );
}
