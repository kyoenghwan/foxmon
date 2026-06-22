import React from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import ActivityClient from './activity-client';

export const metadata = {
  title: '내 활동 - 폭스몬',
  description: '내가 쓴 글과 작성한 댓글을 확인하는 공간입니다.',
};

export default function MyActivityPage() {
  return (
    <SubPageLayout title="내 활동" description="내가 작성한 커뮤니티 게시글과 댓글 리스트입니다." hideSearch={true}>
      <ActivityClient />
    </SubPageLayout>
  );
}
