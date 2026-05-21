'use client';

import React, { useEffect, useState } from 'react';
import { getJobsByIdsAction } from '@/lib/actions';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { Loader2, Clock } from 'lucide-react';

export default function RecentClient() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRecent() {
            try {
                const recentStr = localStorage.getItem('foxmon_recent') || '[]';
                const recentIds = JSON.parse(recentStr);
                if (recentIds.length === 0) {
                    setJobs([]);
                    setLoading(false);
                    return;
                }

                const res = await getJobsByIdsAction(recentIds);
                if (res.success && res.data) {
                    // 로컬스토리지 정렬 순서 유지
                    const jobMap = new Map(res.data.map(j => [j.id, j]));
                    const sortedJobs = recentIds.map((id: string) => jobMap.get(id)).filter(Boolean);
                    setJobs(sortedJobs);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadRecent();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">최근 본 공고를 불러오는 중...</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-3">
                    <Clock className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-[16px] mb-1">최근 본 공고가 없습니다.</p>
                <p className="text-gray-400 text-xs font-medium">다양한 구인구직 정보를 둘러보세요.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {jobs.map((job) => (
                <PremiumJobCard
                    key={job.id}
                    id={job.id}
                    company={job.company_name || job.company || '업소명 미상'}
                    title={job.title || '모집 공고'}
                    location={job.location || '전국'}
                    category={job.category || job.category1 || '기타'}
                    pay={job.pay || '면접 후 결정'}
                    image={job.image || job.photo_url || 'https://picsum.photos/seed/job/800/600'}
                    impactType={job.theme || 'none'}
                    effectIntensity={job.effect_intensity || 'none'}
                    customColor={job.color}
                    isBig={false}
                    tier={job.tier || 'GENERAL'}
                />
            ))}
        </div>
    );
}
