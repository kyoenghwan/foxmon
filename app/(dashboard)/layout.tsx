import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4 md:px-6">
                    <div className="mr-4 hidden md:flex">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            {/* Logo */}
                            <span className="hidden font-bold sm:inline-block">
                                Foxmon
                            </span>
                        </Link>
                        <MainNav />
                    </div>
                    {/* Mobile Nav would go here */}
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <div className="flex items-center space-x-4">
                            {/* Search Input could go here */}

                            {/* Auth Buttons or User Nav */}
                            <div className="flex items-center gap-2">
                                {/* Conditional rendering based on auth state will happen in UserNav or here */}
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm">Sign Up</Button>
                                </Link>
                                <UserNav />
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </main>
        </div>
    );
}
