import { ResumeEditor } from '@/src/components/seeker/ResumeEditor';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SeekerResumePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-20 px-4">
      <ResumeEditor userId={session.user.id!} />
    </div>
  );
}
