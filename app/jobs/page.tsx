import { Suspense } from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import { JobsListContent } from './jobs-list-content';
import { Loader2 } from 'lucide-react';

export default function JobsPage() {
    return (
        <SubPageLayout
            title="구인정보"
            description="전국의 다양한 아르바이트 공고를 확인하세요."
            hideSearch={true}
        >
            <Suspense fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="font-bold text-gray-400">구인 정보를 불러오고 있습니다...</p>
                </div>
            }>
                <JobsListContent />
            </Suspense>
        </SubPageLayout>
    );
}
