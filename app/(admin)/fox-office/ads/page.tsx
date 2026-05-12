import React from 'react';
import { QA_GET_SITE_BANNERS } from '@/src/atoms/qa/admin/QA_GET_SITE_BANNERS';
import { CreditCard, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
    const res = await QA_GET_SITE_BANNERS();
    // 테이블이 없어서 에러가 날 경우 빈 배열 처리
    const banners = res.success && res.data ? res.data : [];
    const dbError = !res.success ? res.error : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        광고 및 배너
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        플랫폼 전체에 노출되는 이벤트 팝업 및 메인 배너를 관리합니다.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[13px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95">
                        <Plus className="w-4 h-4" />
                        새 배너 등록
                    </button>
                </div>
            </div>

            {dbError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold">
                    ⚠️ 데이터베이스 테이블이 아직 생성되지 않았습니다. migration_site_banners.sql 파일을 실행해주세요.
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                            <tr>
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">타입</th>
                                <th className="p-4">배너 제목 / 이미지</th>
                                <th className="p-4 text-center">노출 기간</th>
                                <th className="p-4 text-center">상태</th>
                                <th className="p-4 text-center">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {banners.map((banner: any, idx: number) => {
                                const isActive = banner.is_active;

                                return (
                                    <tr key={banner.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                        <td className="p-4">
                                            {banner.type === 'POPUP' ? (
                                                <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[11px] px-2 py-0.5">팝업 배너</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[11px] px-2 py-0.5">메인 배너</Badge>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {banner.image_url ? (
                                                    <img src={banner.image_url} alt="" className="w-16 h-10 rounded-md object-cover border" />
                                                ) : (
                                                    <div className="w-16 h-10 rounded-md border bg-gray-50 flex items-center justify-center">
                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-gray-900 text-[14px]">{banner.title}</div>
                                                    {banner.link_url && (
                                                        <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-gray-400 hover:text-primary flex items-center gap-1 mt-0.5">
                                                            {banner.link_url.substring(0, 30)}... <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-gray-500 font-medium text-[12px]">
                                            {banner.start_date ? format(new Date(banner.start_date), 'yyyy-MM-dd HH:mm') : '상시'} ~ 
                                            {banner.end_date ? format(new Date(banner.end_date), 'yyyy-MM-dd HH:mm') : '상시'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                                                {isActive ? '노출 중' : '숨김'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-md text-[11px] font-bold transition-colors">
                                                    수정
                                                </button>
                                                <button className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[11px] font-bold transition-colors">
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {banners.length === 0 && !dbError && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                                        등록된 배너/팝업이 없습니다. 우측 상단의 '새 배너 등록' 버튼을 눌러 추가해보세요.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
