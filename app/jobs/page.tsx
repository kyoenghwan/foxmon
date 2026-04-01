import SubPageLayout from '@/components/layout/sub-page-layout';
import { JobsListContent } from './jobs-list-content';

export default function JobsPage() {
    return (
        <SubPageLayout
            title="구인정보"
            description="전국의 다양한 아르바이트 공고를 확인하세요."
        >
            <JobsListContent />
        </SubPageLayout>
    );
}
