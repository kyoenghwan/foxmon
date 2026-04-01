import Link from 'next/link';
import { auth } from '@/auth';
import { Plus, Megaphone, Eye, Pause, Play, Pencil, Clock } from 'lucide-react';

// 추후 QA_GET_MY_ADS 연동 예정
const mockAds: any[] = [];

const TierBadge = ({ tier }: { tier: string }) => {
    const styles: Record<string, string> = {
        PREMIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        SPECIAL: 'bg-purple-100 text-purple-800 border-purple-200',
        GENERAL: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const labels: Record<string, string> = {
        PREMIUM: '🔥 프리미엄',
        SPECIAL: '⚡ 스페셜',
        GENERAL: '일반',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${styles[tier] || styles.GENERAL}`}>
            {labels[tier] || tier}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-700',
        PAUSED: 'bg-gray-100 text-gray-500',
        EXPIRED: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = {
        ACTIVE: '진행 중',
        PAUSED: '일시정지',
        EXPIRED: '만료',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${styles[status] || ''}`}>
            {status === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            {labels[status] || status}
        </span>
    );
};

export default async function BizAdsPage() {
    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        광고 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        등록한 광고를 확인하고 수정·관리하세요.
                    </p>
                </div>
                <Link 
                    href="/biz/ads/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    새 광고 등록
                </Link>
            </div>

            {/* 광고 목록 */}
            {mockAds.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-primary/60" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-gray-800">등록된 광고가 없습니다</h3>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">
                            첫 광고를 등록하고 구직자에게 업체를 알려보세요!
                        </p>
                    </div>
                    <Link 
                        href="/biz/ads/new"
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        첫 광고 등록하기
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-4 text-[12px] font-black text-gray-500">광고명</th>
                                <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">등급</th>
                                <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">상태</th>
                                <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">조회수</th>
                                <th className="text-left px-4 py-4 text-[12px] font-black text-gray-500">만료일</th>
                                <th className="text-right px-6 py-4 text-[12px] font-black text-gray-500">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockAds.map((ad) => (
                                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {ad.image && (
                                                <img src={ad.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div>
                                                <p className="font-bold text-[14px] text-gray-900">{ad.title}</p>
                                                <p className="text-[12px] text-gray-500">{ad.company} · {ad.location}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <TierBadge tier={ad.tier} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={ad.status} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-[13px] font-bold text-gray-700">
                                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                                            {ad.view_count?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-[13px] font-medium text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {ad.expires_at ? new Date(ad.expires_at).toLocaleDateString() : '무기한'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/biz/ads/${ad.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                            </Link>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="일시정지">
                                                {ad.status === 'ACTIVE' 
                                                    ? <Pause className="w-4 h-4 text-gray-500" />
                                                    : <Play className="w-4 h-4 text-green-500" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
