import Link from 'next/link';
import { auth } from '@/auth';
import { 
    Coins, 
    Megaphone, 
    Users, 
    TrendingUp, 
    Plus, 
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    Briefcase
} from 'lucide-react';

export default async function BizDashboardPage() {
    const session = await auth();
    const user = session?.user as any;
    const displayName = user?.nickname || user?.name || '업체회원';

    // 추후 QA_GET_EMPLOYER_DASHBOARD 연동 예정
    // 현재는 UI 뼈대 + users 테이블의 포인트 필드 활용
    const paidPoints = user?.paid_points ?? 0;
    const bonusPoints = user?.bonus_points ?? 0;
    const totalPoints = paidPoints + bonusPoints;

    return (
        <div className="space-y-6">
            {/* 환영 메시지 */}
            <div>
                <h2 className="text-2xl font-black text-gray-900">
                    안녕하세요, <span className="text-primary">{displayName}</span>님 👋
                </h2>
                <p className="text-gray-500 font-medium mt-1">
                    오늘도 최고의 인재를 찾으세요. 폭스몬이 함께합니다.
                </p>
            </div>

            {/* 포인트 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* 총 포인트 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-gray-500">보유 포인트</span>
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Coins className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                        {totalPoints.toLocaleString()}P
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[12px] font-bold">
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            유료 {paidPoints.toLocaleString()}P
                        </span>
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            보너스 {bonusPoints.toLocaleString()}P
                        </span>
                    </div>
                    <Link href="/biz/points" className="mt-4 flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
                        포인트 충전하기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* 진행 중 배너 광고 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-gray-500">진행 중 배너 광고</span>
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">0개</p>
                    <p className="text-[12px] font-medium text-gray-400 mt-2">스페셜/프리미엄 광고</p>
                    <Link href="/biz/ads" className="mt-4 flex items-center gap-1 text-[12px] font-bold text-purple-500 hover:underline">
                        광고 관리하기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* 진행 중 구인 공고 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-gray-500">진행 중 구인 공고</span>
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">0개</p>
                    <p className="text-[12px] font-medium text-gray-400 mt-2">현재 ACTIVE 상태 공고</p>
                    <Link href="/biz/jobs" className="mt-4 flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
                        구인 공고 관리 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* 이번 달 지원자 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-gray-500">이번 달 지원자</span>
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">0명</p>
                    <p className="text-[12px] font-medium text-gray-400 mt-2">내 공고 누적 지원자</p>
                    <Link href="/biz/seekers" className="mt-4 flex items-center gap-1 text-[12px] font-bold text-green-500 hover:underline">
                        지원자 보기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* 빠른 시작 가이드 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-black text-gray-900 text-[16px] mb-5 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    빠른 시작 가이드
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Coins className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[14px] text-gray-800">1단계: 포인트 충전</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">유료 구인/광고 등록에 포인트가 필요합니다. 먼저 충전해 주세요.</p>
                        </div>
                        <Link href="/biz/points" className="shrink-0 px-4 py-2 bg-primary text-white text-[12px] font-black rounded-lg hover:bg-orange-600 transition-colors">
                            충전하기
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[14px] text-gray-800">2단계: 구인 공고 및 광고 등록</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">구인 공고를 올리고, 필요 시 스페셜/프리미엄 배너를 추가합니다.</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <Link href="/biz/jobs/new" className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-black rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> 구인 등록
                            </Link>
                            <Link href="/biz/ads/new" className="px-4 py-1.5 bg-blue-500 text-white text-[11px] font-black rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                                <Megaphone className="w-3 h-3" /> 광고 등록
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[14px] text-gray-800">3단계: 지원자 확인</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">공고에 지원한 구직자 이력서를 확인하고 연락하세요.</p>
                        </div>
                        <Link href="/biz/seekers" className="shrink-0 px-4 py-2 bg-green-500 text-white text-[12px] font-black rounded-lg hover:bg-green-600 transition-colors">
                            확인하기
                        </Link>
                    </div>
                </div>
            </div>

            {/* 공지 / 안내 */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="font-black text-[14px] text-gray-800">포인트 충전 안내</p>
                    <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                        현재 포인트 충전은 <strong>무통장 입금</strong> 방식으로 운영됩니다.
                        충전 신청 후 <strong>영업일 1일 이내</strong>에 담당자가 확인 후 포인트가 지급됩니다.
                    </p>
                    <p className="text-[12px] font-bold text-primary mt-2">
                        입금 계좌 확인은 포인트 관리 → 충전 신청 페이지에서 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
