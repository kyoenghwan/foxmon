'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// import { Icons } from "@/components/icons"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn('flex items-center space-x-4 lg:space-x-6', className)}
            {...props}
        >
            <Link
                href="/"
                className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === '/' ? 'text-black dark:text-white' : 'text-muted-foreground'
                )}
            >
                Home
            </Link>
            <Link
                href="/jobs"
                className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname?.startsWith('/jobs')
                        ? 'text-black dark:text-white'
                        : 'text-muted-foreground'
                )}
            >
                Jobs
            </Link>
            <Link
                href="/employers"
                className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname?.startsWith('/employers')
                        ? 'text-black dark:text-white'
                        : 'text-muted-foreground'
                )}
            >
                For Employers
            </Link>
        </nav>
    );
}
