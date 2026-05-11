'use client';

import { useRouter } from 'next/navigation';

export function GeneralSeekerListRow({ job }: { job: any }) {
    const router = useRouter();
    const { ad_title, created_at, resumes, users } = job;
    const { desired_location, nickname, gender, title, desired_industry, desired_pay_amount, desired_pay_type } = resumes || {};
    
    // 1. 이름 마스킹
    const rawName = nickname || users?.name || '익명';
    const maskedName = rawName.charAt(0) + 'OO';

    // 2. 성별/나이
    const genderKr = gender === 'F' ? '여' : gender === 'M' ? '남' : '무관';
    let ageStr = '';
    if (users?.birth_date && users.birth_date.length >= 4) {
        const birthYear = parseInt(users.birth_date.substring(0, 4));
        const currentYear = new Date().getFullYear();
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

    return (
        <tr 
            onClick={() => {
                // router.push(`/seekers/${job.id}`); // 나중에 상세페이지 연결 시 주석 해제
            }}
            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
        >
            <td className="py-3 px-2 font-bold text-gray-800">{maskedName}</td>
            <td className="py-3 px-2 text-gray-600">{genderAge}</td>
            <td className="py-3 px-4 text-left font-bold text-gray-800 group-hover:text-primary transition-colors truncate max-w-[250px] md:max-w-[400px]">
                {displayTitle}
            </td>
            <td className="py-3 px-2 text-gray-500">{shortLocation}</td>
            <td className="py-3 px-2 text-gray-500">{industry}</td>
            <td className="py-3 px-2">
                <span className="bg-gray-100 text-gray-500 text-[11px] md:text-[12px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    {payText}
                </span>
            </td>
            <td className="py-3 px-2 text-gray-400 font-medium">{dateStr}</td>
        </tr>
    );
}
