import { redirect } from 'next/navigation';

/** 레거시 /notice → 고객센터 공지사항 */
export default function NoticePage() {
  redirect('/help');
}
