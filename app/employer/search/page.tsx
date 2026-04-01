import { EmployerSearchPage } from '@/src/components/employer/SearchPage';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SearchPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10">
      <EmployerSearchPage />
    </div>
  );
}
