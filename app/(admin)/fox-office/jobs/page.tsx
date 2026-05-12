import React from 'react';
import { QA_GET_ALL_BIZ_ADS } from '@/src/atoms/qa/admin/QA_GET_ALL_BIZ_ADS';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage() {
    const res = await QA_GET_ALL_BIZ_ADS();
    const jobs = res.success && res.data ? res.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        공고 승인/관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        업체가 등록한 구인 공고를 모니터링하고 제재할 수 있습니다.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                            <tr>
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">광고(공고) 정보</th>
                                <th className="p-4">작성 업체 (ID)</th>
                                <th className="p-4 text-center">광고 등급</th>
                                <th className="p-4 text-center">노출 만료일</th>
                                <th className="p-4 text-center">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {jobs.map((job: any, idx: number) => {
                                const isPending = new Date(job.expires_at).getFullYear() === 2000;
                                const isExpired = new Date(job.expires_at) < new Date() && !isPending;
                                const statusLabel = isPending ? '결제 대기' : isExpired ? '만료됨' : '진행 중';
                                const statusColor = isPending ? 'text-yellow-600 bg-yellow-50' : isExpired ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';

                                return (
                                    <tr key={job.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {(job.logo_url || job.image) && (
                                                    <img src={job.logo_url || job.image} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                                                )}
                                                <div>
                                                    <Link href={`/jobs/${job.id}`} target="_blank" className="font-bold text-gray-900 text-[14px] hover:text-primary flex items-center gap-1">
                                                        {job.title} <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                    <div className="text-[12px] text-gray-500 font-medium">{job.company} · {job.location}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 text-[13px]">{job.user?.verified_business_name || '미기재'}</div>
                                            <div className="text-[11px] text-gray-500 font-medium">ID: {job.user?.login_id}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge variant="outline" className="text-[11px] px-2 py-0.5">{job.tier || '일반'}</Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${statusColor}`}>
                                                {statusLabel}
                                            </div>
                                            {!isPending && (
                                                <div className="text-[11px] text-gray-400 mt-1">
                                                    {format(new Date(job.expires_at), 'yyyy-MM-dd')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[11px] font-bold transition-colors">
                                                삭제 (숨김)
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                                        등록된 공고가 없습니다.
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
