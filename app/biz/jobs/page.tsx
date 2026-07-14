import Link from 'next/link';
import { auth } from '@/auth';
import { Plus, Briefcase, Pencil, Clock, ShieldAlert } from 'lucide-react';

import { manageAdAction } from '@/lib/actions';
import { supabaseAdmin } from '@/lib/supabase';
import { OpenMyPageButton } from '@/components/biz/OpenMyPageButton';
import { PaymentModalTrigger } from '@/components/biz/PaymentModalTrigger';

const TierBadge = ({ tier }: { tier: string }) => {
    const styles: Record<string, string> = {
        PREMIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        SIDE: 'bg-blue-100 text-blue-800 border-blue-200',
        SPECIAL: 'bg-purple-100 text-purple-800 border-purple-200',
        GENERAL: 'bg-gray-100 text-gray-600 border-gray-200',
        AD_GENERAL: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    const labels: Record<string, string> = {
        PREMIUM: '프리미엄',
        SIDE: '사이드',
        SPECIAL: '스페셜',
        GENERAL: '일반',
        AD_GENERAL: '배너(일반)',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${styles[tier] || styles.GENERAL}`}>
            {labels[tier] || tier || '일반'}
        </span>
    );
};

const StatusBadge = ({ expiresAt }: { expiresAt: string | null | undefined }) => {
    const isPaid = expiresAt && new Date(expiresAt).getTime() > Date.now();
    
    if (isPaid) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-black bg-blue-50 text-blue-600 border border-blue-200">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                ON
            </span>
        );
    } else {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-black bg-gray-50 text-gray-400 border border-gray-200">
                OFF
            </span>
        );
    }
};
const formatKoreanAmount = (amountVal: number): string => {
    if (isNaN(amountVal) || amountVal <= 0) return '-';
    
    // 만원 단위 미만
    if (amountVal < 10000) {
        return `${amountVal.toLocaleString()}원`;
    }
    
    // 만원 단위 이상
    const manValue = Math.floor(amountVal / 10000);
    
    // 억 단위 이상 (1억 = 10000 만원)
    if (manValue >= 10000) {
        const ukValue = Math.floor(manValue / 10000);
        const remainingMan = manValue % 10000;
        
        if (remainingMan > 0) {
            return `${ukValue.toLocaleString()}억 ${remainingMan.toLocaleString()}만원`;
        }
        return `${ukValue.toLocaleString()}억원`;
    }
    
    // 억 미만 만원 단위
    return `${manValue.toLocaleString()}만원`;
};

export default async function BizJobsPage() {
    const session = await auth();
    let isVerified = false;
    let businessType = '비사업자';

    if (session?.user?.id) {
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('is_cert_verified, business_type')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            isVerified = !!profile.is_cert_verified;
            businessType = profile.business_type || '비사업자';
        }
    }

    const hasAccess = true; // 일반 구인 공고는 누구나 인증 없이 즉시 등록 및 관리 가능
    const res = hasAccess ? await manageAdAction('GET') : { success: true, data: [] };
    const mockAds = (res.success && res.data ? res.data : []);

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            구인 관리
                        </h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">
                            등록한 구인공고를 관리하세요.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-150 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                        <ShieldAlert className="w-9 h-9" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-lg text-gray-900">⚠️ 구인회원 승인 필요 안내</h3>
                        {businessType === '사업자' ? (
                            <>
                                <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-lg">
                                    직업안정법 및 관련 법령에 의거하여, **사업자 회원으로 구인 공고를 등록하시려면 사업자인증(사업자등록번호 제출 및 검증)**이 완료되어야 합니다.
                                </p>
                                <p className="text-[12px] font-bold text-red-500 leading-relaxed max-w-lg">
                                    * 마이페이지에서 사업자등록번호를 입력하시고 사업자등록증 이미지를 등록해 주시면 관리자 검토 후 구인 권한이 활성화됩니다.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-lg">
                                    구직자의 신원 안전 및 직업안정법 규정에 의거하여, **일반 (비사업자) 회원으로 구인 공고를 등록하시려면 신분증(주민등록증/운전면허증) 인증**을 받으셔야 합니다.
                                </p>
                                <p className="text-[12px] font-bold text-red-500 leading-relaxed max-w-lg">
                                    * 마이페이지에서 신분증 사진을 업로드해 주시면 관리자 확인 및 승인 처리 후 구인글 등록 권한이 부여됩니다. (뒷자리는 가려주셔도 무방합니다.)
                                </p>
                            </>
                        )}
                    </div>
                    <OpenMyPageButton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        구인 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        등록한 구인공고를 관리하세요.
                    </p>
                </div>
                <Link 
                    href="/biz/jobs/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    새 공고 등록
                </Link>
            </div>

            {/* 광고 목록 */}
            {mockAds.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-primary/60" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-gray-800">등록된 구인 공고가 없습니다</h3>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">
                            첫 구인 공고를 등록하고 구직자에게 업체를 알려보세요!
                        </p>
                    </div>
                    <Link 
                        href="/biz/jobs/new"
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        첫 구인 공고 등록하기
                    </Link>
                </div>
            ) : (
                <div className="bg-transparent md:bg-white rounded-2xl md:border md:border-gray-100 md:shadow-sm overflow-hidden">
                    {/* 데스크톱용 테이블 뷰 */}
                    <style>{`
                        @keyframes jobMarquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-job-marquee {
                            display: inline-flex;
                            white-space: nowrap;
                            animation: jobMarquee 15s linear infinite;
                        }
                    `}</style>
                    <table className="w-full hidden md:table table-fixed">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500 w-[120px]">근무지역</th>
                                <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500 w-[110px]">직종</th>
                                <th className="text-left px-6 py-4 text-[12px] font-black text-gray-500 w-[180px]">제목</th>
                                <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500 w-[120px]">업소명</th>
                                <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500 w-[120px]">급여</th>
                                <th className="text-center px-4 py-4 text-[12px] font-black text-gray-500 w-[110px]">마감일</th>
                                <th className="text-center px-6 py-4 text-[12px] font-black text-gray-500 w-[150px]">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockAds.map((ad) => (
                                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 text-center text-[13px] font-medium text-gray-600 truncate">
                                        {ad.location || ad.address || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center text-[13px] font-medium text-gray-600 truncate">
                                        {ad.category1 || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {ad.image && (
                                                <img src={ad.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div className="w-[150px] overflow-hidden relative h-5 flex items-center justify-start">
                                                {ad.title.length > 5 ? (
                                                    <div className="absolute w-max flex items-center gap-4 animate-job-marquee">
                                                        <span className="font-bold text-[14px] text-gray-900">{ad.title}</span>
                                                        <span className="font-bold text-[14px] text-gray-900">{ad.title}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-[14px] text-gray-900 w-full text-left truncate">{ad.title}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="w-[110px] overflow-hidden relative h-5 flex items-center justify-center mx-auto">
                                            {ad.company_name && ad.company_name.length > 5 ? (
                                                <div className="absolute w-max flex items-center gap-4 animate-job-marquee">
                                                    <span className="text-[13.5px] font-bold text-gray-700">{ad.company_name}</span>
                                                    <span className="text-[13.5px] font-bold text-gray-700">{ad.company_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[13.5px] font-bold text-gray-700 w-full text-center truncate">
                                                    {ad.company_name || ad.company || ad.business_name || '-'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {ad.salary_type && (
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                                    ad.salary_type === '시급' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                    ad.salary_type === '일급' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    ad.salary_type === '월급' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                    ad.salary_type === '주급' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                    ad.salary_type === '건당' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                    'bg-gray-50 text-gray-600 border border-gray-150'
                                                }`}>
                                                    {ad.salary_type}
                                                </span>
                                            )}
                                            <span className="font-extrabold text-[13.5px] text-gray-900 whitespace-nowrap">
                                                {ad.salary_amount
                                                    ? formatKoreanAmount(Number(String(ad.salary_amount).replace(/[^0-9]/g, '')))
                                                    : ad.pay || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {(!ad.close_date || ad.close_date === '상시채용') ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-50 text-teal-600 border border-teal-150 whitespace-nowrap">
                                                상시채용
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center justify-center gap-1 text-[13px] font-medium text-gray-500 whitespace-nowrap">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {ad.close_date}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/biz/jobs/${ad.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="수정">
                                                <Pencil className="w-4 h-4 text-gray-600" />
                                            </Link>
                                            <PaymentModalTrigger ad={ad} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 모바일용 카드 리스트 뷰 */}
                    <div className="md:hidden space-y-3.5">
                        {mockAds.map((ad) => (
                            <div key={ad.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {ad.image && (
                                            <img src={ad.image} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100" />
                                        )}
                                        <div>
                                            <h4 className="font-extrabold text-[14px] text-gray-900 leading-snug">{ad.title}</h4>
                                            <p className="text-[11.5px] text-gray-400 mt-1 font-bold">
                                                {ad.company_name || ad.company || ad.business_name} | {ad.location}
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[11px] font-bold text-gray-500">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {ad.salary_type && (
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 ${
                                                    ad.salary_type === '시급' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                    ad.salary_type === '일급' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    ad.salary_type === '월급' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                    ad.salary_type === '주급' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                    ad.salary_type === '건당' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                    'bg-gray-50 text-gray-600 border border-gray-150'
                                                }`}>
                                                    {ad.salary_type}
                                                </span>
                                            )}
                                            <span className="font-extrabold text-[12px] text-gray-900">
                                                {ad.salary_amount
                                                    ? formatKoreanAmount(Number(String(ad.salary_amount).replace(/[^0-9]/g, '')))
                                                    : ad.pay || '-'}
                                            </span>
                                        </div>
                                        {(!ad.close_date || ad.close_date === '상시채용') ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-black bg-teal-50 text-teal-600 border border-teal-100 whitespace-nowrap">
                                                상시
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {ad.close_date}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/biz/jobs/${ad.id}`} className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-xl transition-colors" title="수정">
                                            <Pencil className="w-3.5 h-3.5 text-gray-600" />
                                        </Link>
                                        <PaymentModalTrigger ad={ad} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
