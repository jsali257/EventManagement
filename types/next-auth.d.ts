import type { UserRole } from "@/types";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      employeeId: string | null;
    };
  }

  interface User {
    role: UserRole;
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    employeeId: string | null;
  }
}
