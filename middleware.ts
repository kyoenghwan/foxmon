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

    // 0. Transient Session (PC Bang Security) Check
    if (session?.user) {
        const isAutoLogin = cookies.has('foxmon_auto_login');
        const isTransientActive = cookies.has('foxmon_transient');

        // 만약 '자동 로그인' 상태가 아닌데, 브라우저 세션(transient)이 죽어있다면 -> 강제 로그아웃
        if (!isAutoLogin && !isTransientActive) {
            // 무한 리다이렉트 루프 방지: 이미 login 페이지에 도착했다면 다시 redirect 하지 말고 next() 통과시킴
            if (nextUrl.pathname === '/login') {
                const response = NextResponse.next();
                response.cookies.delete('authjs.session-token');
                response.cookies.delete('__Secure-authjs.session-token');
                response.cookies.delete('next-auth.session-token');
                return response;
            }

            const response = NextResponse.redirect(new URL('/login?session_expired=1', nextUrl));
            response.cookies.delete('authjs.session-token');
            response.cookies.delete('__Secure-authjs.session-token');
            response.cookies.delete('next-auth.session-token');
            return response;
        }
    }

    // 1. Admin Path Security Check (Obscure path: /fox-office)
    if (isAdminPath) {
        const userRole = (session?.user as any)?.role;
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // 2. Age Gate Check (Redirect all unverified users to /age-gate EXCEPT if they are trying to register)
    if (!isAgeVerified && !isAgeGatePage && !isRegisterPage && !isPublicStatic && !isAdminPath) {
        return NextResponse.redirect(new URL('/age-gate', nextUrl));
    }

    // 3. Already Verified handling: Don't show age-gate if already verified
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
