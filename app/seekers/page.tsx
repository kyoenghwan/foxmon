import SubPageLayout from '@/components/layout/sub-page-layout';
import { RegionSelector } from '@/components/home/region-selector';
import { IndustrySelector } from '@/components/home/industry-selector';

export default function SeekersPage() {
    return (
        <SubPageLayout
            title="구직정보"
            description="나에게 딱 맞는 인재를 찾아보세요."
            hideSearch={true}
        >
            <div className="space-y-12">
                {/* Search Condition Card */}
                <section className="bg-white rounded-xl p-4 border shadow-sm space-y-4">
                    {/* Region Selection */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                            <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                            지역 선택
                        </h2>
                        <div className="flex-1 overflow-x-auto pb-1">
                            <RegionSelector />
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Industry Selection */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <h2 className="text-[13px] font-extrabold flex items-center gap-2 text-gray-800 w-full sm:w-24 shrink-0 mt-1 sm:mt-2">
                            <span className="w-1.5 h-3.5 bg-orange-400 rounded-full" />
                            업종 선택
                        </h2>
                        <div className="flex-1 overflow-x-auto pb-1">
                            <IndustrySelector />
                        </div>
                    </div>
                </section>

                {/* Placeholder for future Seekers List Content */}
                <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                    <p className="text-gray-400 font-medium">구직정보 목록을 준비 중입니다.</p>
                </div>
            </div>
        </SubPageLayout>
    );
}
