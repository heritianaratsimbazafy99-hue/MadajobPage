"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className={["btn", "btn-secondary", className].filter(Boolean).join(" ")}
      type="button"
      onClick={handleSignOut}
    >
      Se deconnecter
    </button>
  );
}
