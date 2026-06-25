import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id?: string;
    login_id?: string;
    is_age_verified?: boolean;
    role?: string;
    staff_team?: string;
    business_number?: string;
    nickname?: string;
    autoLogin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      login_id?: string;
      is_age_verified?: boolean;
      role?: string;
      staff_team?: string;
      business_number?: string;
      nickname?: string;
      autoLogin?: boolean;
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/types" {
  interface User {
    id?: string;
    login_id?: string;
    is_age_verified?: boolean;
    role?: string;
    staff_team?: string;
    business_number?: string;
    nickname?: string;
    autoLogin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      login_id?: string;
      is_age_verified?: boolean;
      role?: string;
      staff_team?: string;
      business_number?: string;
      nickname?: string;
      autoLogin?: boolean;
    } & DefaultSession["user"]
  }
}

import { type JWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
  interface JWT {
    login_id?: string;
    is_age_verified?: boolean;
    role?: string;
    staff_team?: string;
    business_number?: string;
    nickname?: string;
    autoLogin?: boolean;
  }
}
