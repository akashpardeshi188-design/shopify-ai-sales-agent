import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely. Only call from trusted server code that does its own
// authorization (sync jobs, webhook handlers) — never from a path that takes
// a store/org id straight from a request without first checking the caller
// can see that row via the regular RLS-scoped client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
