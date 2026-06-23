import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In | RGV911 Volunteer Management",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Logo & Branding */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
          <img
            src="/api/image-proxy?url=https%3A%2F%2Fapi.rgv911.org%2Fapi%2Fshares%2FuG1ey4BLcia0Z8z-XYtFf3pJxBfnvFB1%2Fview%2FRGV911-Logo_pqibpo.png"
            alt="RGV911"
            className="h-16 w-16 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          RGV911 Volunteer Management
        </h1>
        <p className="mt-1 text-sm text-blue-200/70">
          Public Education Department
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-white/50">
              Sign in to your account to continue
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/30">
          <Shield className="h-3 w-3" />
          <span>Internal system — authorized personnel only</span>
        </div>
      </div>
    </div>
  );
}
