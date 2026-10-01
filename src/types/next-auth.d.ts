import type { DefaultSession } from "next-auth";

type UserRole = "teacher" | "student";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    studentId?: number;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      studentId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    studentId?: number;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleAccessTokenExpiresAt?: number;
  }
}
