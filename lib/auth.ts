import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (work day)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role?: UserRole }).role ?? "EMPLOYEE";
        token.employeeId = (user as { employeeId?: string }).employeeId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.employeeId = token.employeeId as string | null;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { employee: { select: { id: true } } },
        });

        if (!user || !user.isActive) return null;
        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => null);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          employeeId: user.employee?.id ?? null,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user.id) {
        await prisma.activityLog
          .create({
            data: {
              action: "USER_LOGIN",
              entityType: "User",
              entityId: user.id,
              description: `${user.name ?? user.email} signed in`,
              userId: user.id,
            },
          })
          .catch(() => null);
      }
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      if (token?.sub) {
        await prisma.activityLog
          .create({
            data: {
              action: "USER_LOGOUT",
              entityType: "User",
              entityId: token.sub,
              description: "User signed out",
              userId: token.sub,
            },
          })
          .catch(() => null);
      }
    },
  },
});
