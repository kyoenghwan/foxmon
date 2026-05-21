import React from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import ScrapsClient from './scraps-client';

export const metadata = {
  title: '스크랩 공고 - 폭스몬',
  description: '내가 스크랩하여 간직한 구인구직 공고 리스트입니다.',
};

export default function MyScrapsPage() {
  return (
    <SubPageLayout title="스크랩 공고" description="내가 스크랩하여 간직한 공고 리스트입니다." hideSearch={true}>
      <ScrapsClient />
    </SubPageLayout>
  );
}
