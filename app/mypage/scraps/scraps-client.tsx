'use client';

import React, { useEffect, useState } from 'react';
import { getJobsByIdsAction } from '@/lib/actions';
import { PremiumJobCard } from '@/components/home/premium-job-card';
import { Loader2, Heart } from 'lucide-react';

export default function ScrapsClient() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadScraps() {
            try {
                const scrapStr = localStorage.getItem('foxmon_scraps') || '[]';
                const scrapIds = JSON.parse(scrapStr);
                if (scrapIds.length === 0) {
                    setJobs([]);
                    setLoading(false);
                    return;
                }

                const res = await getJobsByIdsAction(scrapIds);
                if (res.success && res.data) {
                    setJobs(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadScraps();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">스크랩한 공고를 불러오는 중...</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
                    <Heart className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-[16px] mb-1">스크랩한 공고가 없습니다.</p>
                <p className="text-gray-400 text-xs font-medium">관심 있는 공고 상세 페이지에서 하트 버튼을 눌러보세요.</p>
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
