'use client';

import React, { useEffect, useState } from 'react';
import { getJobsByIdsAction } from '@/lib/actions';
import { Loader2, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

interface AppliedItem {
    jobId: string;
    appliedAt: string;
}

export default function ApplicationsClient() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadApplications() {
            try {
                const appStr = localStorage.getItem('foxmon_applications') || '[]';
                const appList: AppliedItem[] = JSON.parse(appStr);
                if (appList.length === 0) {
                    setJobs([]);
                    setLoading(false);
                    return;
                }

                const jobIds = appList.map(item => item.jobId);
                const res = await getJobsByIdsAction(jobIds);
                if (res.success && res.data) {
                    // 지원 시간 결합
                    const appMap = new Map(appList.map(item => [item.jobId, item.appliedAt]));
                    const combined = res.data.map(job => ({
                        ...job,
                        appliedAt: appMap.get(job.id)
                    }));
                    // 지원 시간 최신순으로 정렬
                    combined.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
                    setJobs(combined);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadApplications();
    }, []);

    const formatDate = (isoString?: string) => {
        if (!isoString) return '확인불가';
        const d = new Date(isoString);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">지원 내역을 불러오는 중...</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                    <FileText className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-[16px] mb-1">지원한 공고가 없습니다.</p>
                <p className="text-gray-400 text-xs font-medium">폭스톡 지원하기를 통해 업체와 바로 대화해보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job) => (
                <div key={job.id} className="p-4 sm:p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                {job.category || job.category1 || '기타'}
                            </span>
                            <span className="text-xs font-bold text-gray-500">{job.location || '전국'}</span>
                        </div>
                        <h3 className="font-black text-gray-900 text-[15px] sm:text-[17px] tracking-tight truncate mb-1">
                            <Link href={`/jobs/${job.id}`} className="hover:text-primary transition-colors">
                                {job.title}
                            </Link>
                        </h3>
                        <p className="text-sm font-bold text-gray-600 mb-2 sm:mb-0">
                            {job.company_name || job.company || '업소명 미상'}
                        </p>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0 shrink-0 gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>지원일시:</span>
                            <span className="font-bold text-gray-600">{formatDate(job.appliedAt)}</span>
                        </div>
                        <Link 
                            href={`/jobs/${job.id}`}
                            className="text-xs font-black text-white px-4 py-2 bg-gray-950 hover:bg-black rounded-xl transition-all shadow-sm active:scale-[0.98]"
                        >
                            공고 상세보기
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
