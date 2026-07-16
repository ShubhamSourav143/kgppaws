import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <AuthCard mode="login" />
        <p className="mt-5 text-center text-sm text-moss">
          New here?{" "}
          <Link href="/signup" className="font-bold text-forest underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
