import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ 
                        loginId: z.string().min(4), 
                        password: z.string().min(4),
                        autoLogin: z.string().optional() // 'true' or 'false'
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { FA_LOGIN_FLOW } = await import('@/src/atoms/fa/auth/FA_LOGIN_FLOW');
                    const result = await FA_LOGIN_FLOW(parsedCredentials.data);
                    
                    if (result.success && result.data) {
                        return {
                            id: result.data.userId,
                            login_id: result.data.loginId,
                            email: result.data.email,
                            is_age_verified: result.data.is_age_verified,
                            role: (result.data as any).role,
                            business_number: (result.data as any).business_number,
                            nickname: (result.data as any).nickname,
                            autoLogin: parsedCredentials.data.autoLogin === 'true',
                        };
                    }
                }

                console.log('Authentication failed or invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                token.login_id = (user as any).login_id;
                token.is_age_verified = (user as any).is_age_verified;
                token.role = (user as any).role;
                token.business_number = (user as any).business_number;
                token.nickname = (user as any).nickname;
                token.autoLogin = (user as any).autoLogin;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                (session.user as any).login_id = token.login_id;
                (session.user as any).is_age_verified = token.is_age_verified;
                (session.user as any).role = token.role;
                (session.user as any).business_number = token.business_number;
                (session.user as any).nickname = token.nickname;
                (session.user as any).autoLogin = token.autoLogin;
            }
            return session;
        },
    },
});
