'use client';

import { useRouter } from 'next/navigation';

export function GeneralSeekerListRow({ job, onClick }: { job: any; onClick?: () => void }) {
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

    // 7. 작성일
    const dateObj = new Date(created_at);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

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
            className={`p-4 hover:bg-gray-50/80 active:scale-[0.99] transition-all border-b border-gray-100 flex flex-col gap-2.5 cursor-pointer relative group ${isInactive ? 'opacity-50 grayscale' : ''}`}
        >
            {/* 1행: 이름, 성별/나이 및 메타 정보, 작성일 */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] sm:text-[13px]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-extrabold text-gray-900 text-[14px] sm:text-[15px] shrink-0">
                        {maskedName}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    <span className="font-bold text-gray-600 shrink-0">
                        {genderAge}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    
                    {/* 조건 데이터들 배지 형태로 정렬 */}
                    <span className="font-bold text-gray-500 shrink-0">
                        📍 {shortLocation}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    <span className="font-bold text-gray-500 shrink-0">
                        💼 {industry}
                    </span>
                    <span className="text-gray-400 shrink-0">|</span>
                    <span className="bg-orange-50 text-orange-600 text-[11px] font-black px-2 py-0.5 rounded-full border border-orange-100/50 shrink-0">
                        {payText}
                    </span>
                </div>
                <div className="text-gray-400 font-semibold shrink-0 text-[11px] sm:text-[12px] ml-auto">
                    {dateStr}
                </div>
            </div>
            
            {/* 2행: 제목 (긴 텍스트가 잘리지 않고 말줄임표 없이 전부 보이도록 함) */}
            <div className="flex items-start gap-2">
                {isInactive && (
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-black whitespace-nowrap mt-0.5 shrink-0">
                        구직 완료
                    </span>
                )}
                <h3 className="font-extrabold text-[14px] sm:text-[15px] text-gray-800 leading-snug group-hover:text-primary transition-colors whitespace-pre-wrap break-all flex-1">
                    {displayTitle}
                </h3>
            </div>
        </div>
    );
}
