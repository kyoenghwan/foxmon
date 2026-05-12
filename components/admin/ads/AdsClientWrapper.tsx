'use client';

import React, { useState } from 'react';
import { Plus, ExternalLink, ImageIcon, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { BannerFormModal } from './BannerFormModal';
import { adminSiteBannerAction } from '@/lib/actions';

export function AdsClientWrapper({ initialBanners }: { initialBanners: any[] }) {
    const [banners, setBanners] = useState(initialBanners);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<'ALL' | 'POPUP' | 'MAIN_BANNER'>('ALL');

    const handleOpenNew = () => {
        setSelectedBanner(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (banner: any) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 배너를 삭제하시겠습니까?')) return;
        const res = await adminSiteBannerAction('DELETE', id);
        if (res.success) {
            setBanners(banners.filter((b) => b.id !== id));
        } else {
            alert(res.message || '삭제에 실패했습니다.');
        }
    };

    const handleSuccess = () => {
        // Since we are using revalidatePath, reloading the page will show new data
        window.location.reload();
    };

    const filteredBanners = banners.filter(b => activeTab === 'ALL' || b.type === activeTab);

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        전체 보기
                    </button>
                    <button 
                        onClick={() => setActiveTab('POPUP')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'POPUP' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        이벤트 팝업 관리
                    </button>
                    <button 
                        onClick={() => setActiveTab('MAIN_BANNER')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'MAIN_BANNER' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        메인 배너 관리
                    </button>
                </div>
                
                <button 
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[13px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    새 배너 등록
                </button>
            </div>

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
                            {filteredBanners.map((banner: any, idx: number) => {
                                const isActive = banner.is_active;

                                return (
                                    <tr key={banner.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                        <td className="p-4">
                                            {banner.type === 'POPUP' ? (
                                                <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[11px] px-2 py-0.5">이벤트 팝업</Badge>
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
                                            {banner.start_date ? format(new Date(banner.start_date), 'yyyy-MM-dd HH:mm') : '상시'} ~ <br/>
                                            {banner.end_date ? format(new Date(banner.end_date), 'yyyy-MM-dd HH:mm') : '상시'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                                                {isActive ? '노출 중' : '숨김'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(banner)}
                                                    className="p-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredBanners.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                                        등록된 {activeTab === 'POPUP' ? '팝업 배너' : activeTab === 'MAIN_BANNER' ? '메인 배너' : '배너/팝업'}가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <BannerFormModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    initialData={selectedBanner}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
