import React from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import ApplicationsClient from './applications-client';

export const metadata = {
  title: '지원한 공고 - 폭스몬',
  description: '폭스톡 지원하기를 통해 연락을 취한 구인구직 공고 목록입니다.',
};

export default function MyApplicationsPage() {
  return (
    <SubPageLayout title="지원한 공고" description="폭스톡 지원하기를 통해 연락을 취한 공고 목록입니다." hideSearch={true}>
      <ApplicationsClient />
    </SubPageLayout>
  );
}
