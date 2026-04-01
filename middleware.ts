import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, cookies, auth: session } = req;
    
    const isCookieVerified = cookies.has('age_verified');
    const isSessionVerified = session?.user && (session.user as any).is_age_verified;
    const isAgeVerified = isCookieVerified || isSessionVerified;

    const isAgeGatePage = nextUrl.pathname === '/age-gate';
    const isRegisterPage = nextUrl.pathname === '/register';
    const isAdminPath = nextUrl.pathname.startsWith('/fox-office');
    const isPublicStatic = nextUrl.pathname.includes('.') || nextUrl.pathname.startsWith('/_next');

    // 0. Admin Path Security Check (Obscure path: /fox-office)
    if (isAdminPath) {
        const userRole = (session?.user as any)?.role;
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // 1. Age Gate Check (Redirect all unverified users to /age-gate EXCEPT if they are trying to register)
    if (!isAgeVerified && !isAgeGatePage && !isRegisterPage && !isPublicStatic && !isAdminPath) {
        return NextResponse.redirect(new URL('/age-gate', nextUrl));
    }

    // 2. Already Verified handling: Don't show age-gate if already verified
    if (isAgeVerified && isAgeGatePage) {
        // If they are logged in, go to home. If not, they are likely in the middle of registration, so go to /register.
        const redirectTo = session?.user ? '/' : '/register';
        return NextResponse.redirect(new URL(redirectTo, nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
