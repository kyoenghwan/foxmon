import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import {
    canAccessFoxOfficeAdmin,
    canAccessFoxOfficeSupportRoutes,
    isFoxOfficeSupportPath,
} from '@/lib/help-center-auth';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, cookies, auth: session } = req;
    
    const isCookieVerified = cookies.has('age_verified');
    const isSessionVerified = session?.user && (session.user as any).is_age_verified;
    const isAgeVerified = isCookieVerified || isSessionVerified;

    const isAgeGatePage = nextUrl.pathname === '/age-gate';
    const isRegisterPage = nextUrl.pathname === '/register';
    const isLoginPage = nextUrl.pathname === '/login';
    const isAdminPath = nextUrl.pathname.startsWith('/fox-office');
    const isSeoPath = nextUrl.pathname.startsWith('/k/') || nextUrl.pathname === '/sitemap.xml';
    const isPublicStatic = nextUrl.pathname.includes('.') || nextUrl.pathname.startsWith('/_next');

    // 0. Transient Session (PC Bang Security) Check
    if (session?.user) {
        const isAutoLogin = cookies.has('foxmon_auto_login');
        const isTransientActive = cookies.has('foxmon_transient');

        // 만약 '자동 로그인' 상태가 아닌데, 브라우저 세션(transient)이 죽어있다면 -> 강제 로그아웃
        if (!isAutoLogin && !isTransientActive) {
            if (nextUrl.pathname === '/login') {
                const response = NextResponse.next();
                response.cookies.set({ name: 'authjs.session-token', value: '', maxAge: 0, path: '/' });
                response.cookies.set({ name: '__Secure-authjs.session-token', value: '', maxAge: 0, path: '/', secure: true });
                response.cookies.set({ name: 'next-auth.session-token', value: '', maxAge: 0, path: '/' });
                response.cookies.set({ name: '__Secure-next-auth.session-token', value: '', maxAge: 0, path: '/', secure: true });
                return response;
            }

            const url = new URL('/login', nextUrl);
            url.searchParams.set('session_expired', '1');
            const response = NextResponse.redirect(url);
            response.cookies.set({ name: 'authjs.session-token', value: '', maxAge: 0, path: '/' });
            response.cookies.set({ name: '__Secure-authjs.session-token', value: '', maxAge: 0, path: '/', secure: true });
            response.cookies.set({ name: 'next-auth.session-token', value: '', maxAge: 0, path: '/' });
            response.cookies.set({ name: '__Secure-next-auth.session-token', value: '', maxAge: 0, path: '/', secure: true });
            return response;
        }
    }

    // 1. Admin Path Security Check (Obscure path: /fox-office)
    if (isAdminPath) {
        const user = session?.user as {
            id?: string;
            role?: string;
            login_id?: string;
            staff_team?: string;
        };
        const allowed = isFoxOfficeSupportPath(nextUrl.pathname)
            ? canAccessFoxOfficeSupportRoutes(user)
            : canAccessFoxOfficeAdmin(user);
        if (!allowed) {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // 1.5 Global Authentication Check (Strict Private Mode as requested by user)
    // 로그인이 안 된 상태면 무조건 /login으로 리다이렉트 (회원가입, 로그인, 정적 파일 제외)
    // if (!session?.user && !isLoginPage && !isRegisterPage && !isPublicStatic) {
    //     return NextResponse.redirect(new URL('/login', nextUrl));
    // }
 
    // 2. Age Gate Check (Redirect all unverified users to /age-gate EXCEPT if they are trying to register, login, or access SEO pages)
    // if (!isAgeVerified && !isAgeGatePage && !isRegisterPage && !isLoginPage && !isSeoPath && !isPublicStatic && !isAdminPath) {
    //     return NextResponse.redirect(new URL('/age-gate', nextUrl));
    // }
 
    // 3. Already Verified handling: Don't show age-gate if already verified
    // if (isAgeVerified && isAgeGatePage) {
    //     // If they are logged in, go to home. If not, they are likely in the middle of registration, so go to /register.
    //     const redirectTo = session?.user ? '/' : '/register';
    //     return NextResponse.redirect(new URL(redirectTo, nextUrl));
    // }
 
    return NextResponse.next();
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
