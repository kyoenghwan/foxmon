'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function UserNav() {
    const { data: session } = useSession();

    if (!session?.user) {
        return (
            <Link href="/login">
                <Button variant="outline" size="sm">로그인</Button>
            </Link>
        );
    }

    const { name, email, image, role } = session.user as any;
    const isEmployer = role === 'EMPLOYER' || role === 'ADMIN';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={image || ''} alt={name || ''} />
                        <AvatarFallback>{name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {/* 사장님 전용 메뉴 */}
                    {isEmployer && (
                        <DropdownMenuItem asChild>
                            <Link href="/employer/points" className="cursor-pointer font-semibold text-primary">
                                💰 포인트/환불 관리
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href={isEmployer ? "/employer/profile" : "/job-seeker/profile"}>프로필 설정</Link>
                    </DropdownMenuItem>
                    {!isEmployer && (
                        <DropdownMenuItem asChild>
                            <Link href="/job-seeker/applications">지원 내역</Link>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600">
                    로그아웃
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
