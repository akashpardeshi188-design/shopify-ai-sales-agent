import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Verified identity check — contacts the Supabase Auth server. Use this (not
// the raw cookie) anywhere a real authorization decision is made.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export type CurrentMembership = {
  role: "owner" | "admin" | "member";
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
  };
};

// A user's first organization membership. Multi-org switching is out of
// scope for now — every account has exactly one org after onboarding.
export const getCurrentMembership = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select(
      "role, organization:organizations(id, name, slug, plan, subscription_status)"
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data as CurrentMembership | null;
});

export async function requireOrganization() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");
  return membership;
}
