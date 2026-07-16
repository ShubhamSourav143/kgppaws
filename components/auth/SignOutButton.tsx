"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutDemo } from "@/lib/local-store";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        signOutDemo();
        router.push("/");
      }}
      className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-bold text-forest transition-colors hover:bg-mist"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </button>
  );
}
