import React from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import RecentClient from './recent-client';

export const metadata = {
  title: '최근 본 공고 - 폭스몬',
  description: '최근에 상세 정보를 조회한 구인구직 공고 리스트입니다.',
};

export default function MyRecentPage() {
  return (
    <SubPageLayout title="최근 본 공고" description="최근에 상세 내용을 조회한 공고 리스트입니다." hideSearch={true}>
      <RecentClient />
    </SubPageLayout>
  );
}
