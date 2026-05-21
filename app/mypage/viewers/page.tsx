import React from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import ViewersClient from './viewers-client';

export const metadata = {
  title: '나를 본 업체 - 폭스몬',
  description: '내 상세 이력서 정보를 조회한 고용주(업소)들의 리스트입니다.',
};

export default function MyViewersPage() {
  return (
    <SubPageLayout title="나를 본 업체" description="내 이력서 프로필 정보를 조회한 고용주 리스트입니다." hideSearch={true}>
      <ViewersClient />
    </SubPageLayout>
  );
}
