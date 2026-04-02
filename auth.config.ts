import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        newUser: '/register',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours (1 day) limit to prevent permanent sessions even if browser restores cookies
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
            const isPublicStatic = nextUrl.pathname.includes('.') || nextUrl.pathname.startsWith('/_next');

            if (isOnAuth || isPublicStatic) {
                if (isLoggedIn && isOnAuth) {
                    // 무한 리디렉션 룹 방지: session_expired 파라미터가 있으면 로그인 페이지에 머물도록 허용
                    if (nextUrl.searchParams.get('session_expired') === '1') {
                        return true;
                    }
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            if (!isLoggedIn) {
                // All other routes require login for an adult-only site
                return false; 
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.is_age_verified = (user as any).is_age_verified;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).is_age_verified = token.is_age_verified;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
