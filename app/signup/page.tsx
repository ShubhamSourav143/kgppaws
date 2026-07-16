import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <AuthCard mode="signup" />
        <p className="mt-5 text-center text-sm text-moss">
          Already with the pack?{" "}
          <Link href="/login" className="font-bold text-forest underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
