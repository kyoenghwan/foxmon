'use client';

import { useState, useEffect } from 'react';
import { manageAdAction, manageBizAdAction } from '@/lib/actions';
import { X, Search, FileText, Megaphone } from 'lucide-react';

interface LoadMyDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: any) => void;
    sourceType: 'JOB' | 'AD'; // 불러올 원본 데이터의 종류
}

export function LoadMyDataModal({ isOpen, onClose, onSelect, sourceType }: LoadMyDataModalProps) {
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // sourceType이 JOB이면 일반 구인 공고(jobs)를, AD면 배너 광고(biz_ads)를 불러옵니다.
                const res = sourceType === 'JOB' 
                    ? await manageAdAction('GET') 
                    : await manageBizAdAction('GET');

                if (res.success && res.data) {
                    setDataList(res.data);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, sourceType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        {sourceType === 'JOB' ? <FileText className="w-5 h-5 text-green-500" /> : <Megaphone className="w-5 h-5 text-orange-500" />}
                        {sourceType === 'JOB' ? '내 구인 공고 불러오기' : '내 광고 본문 불러오기'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] font-black transition-all focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0"
                    >
                        닫기
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : dataList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            {sourceType === 'JOB' ? <FileText className="w-12 h-12 text-gray-300 mb-4" /> : <Megaphone className="w-12 h-12 text-gray-300 mb-4" />}
                            <p className="text-sm font-bold">등록된 {sourceType === 'JOB' ? '구인 공고가' : '광고가'} 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dataList.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="bg-white border rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-y-0 left-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {item.logo_url ? (
                                                <img src={item.logo_url} alt="logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400">NO LOGO</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-500 mb-1 truncate">{item.company_name || '업체명 없음'}</div>
                                            <div className="text-sm font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                                                {item.title || '제목 없음'}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{item.tier || '기본'}</span>
                                                <span className="truncate">{item.location || '지역 미지정'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
