import { AdminSidebar } from '@/src/components/admin/AdminSidebar';
import { AdminNavbar } from '@/src/components/admin/AdminNavbar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Security check (Duplicate of middleware for solid isolation)
    if (!session?.user || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
        redirect('/');
    }

    return (
        <div className="flex h-screen bg-[#f9fafb] overflow-hidden">
            {/* Sidebar (Fixed Width) */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
                <AdminNavbar session={session} />
                <main className="p-8 lg:p-12 mb-20 flex-1">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
                
                <footer className="px-8 py-6 text-[12px] text-gray-400 font-medium bg-white border-t mt-auto">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                        <p>© 2026 Foxmon Admin System v1.0. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <span className="hover:text-primary transition-colors cursor-pointer">Security Policy</span>
                            <span className="hover:text-primary transition-colors cursor-pointer">Support</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
