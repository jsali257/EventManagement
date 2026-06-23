import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

// Edge-safe auth config — no Prisma, no bcrypt, no Node.js-only modules.
// Used only by middleware to validate the JWT without a database call.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" as const, maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role?: UserRole }).role ?? "EMPLOYEE";
        token.employeeId = (user as { employeeId?: string }).employeeId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.employeeId = token.employeeId as string | null;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
