"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { connectStoreSchema } from "@/lib/validations/stores";
import {
  REQUIRED_SCOPES,
  createShopifyClient,
  normalizeShopDomain,
} from "@/lib/shopify/client";
import { encrypt } from "@/lib/shopify/encryption";
import { VALIDATE_CONNECTION_QUERY } from "@/lib/shopify/queries";
import { registerWebhooks } from "@/lib/shopify/webhooks";
import { runFullSync } from "@/lib/shopify/sync";
import type { ValidateConnectionResult } from "@/lib/shopify/types";
import type { FormState } from "@/lib/auth/actions";

export async function connectStore(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const membership = await requireOrganization();
  if (membership.role === "member") {
    return { message: "Only organization admins can connect a store." };
  }

  const validated = connectStoreSchema.safeParse({
    shopDomain: formData.get("shopDomain"),
    accessToken: formData.get("accessToken"),
    webhookSecret: formData.get("webhookSecret"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { accessToken, webhookSecret } = validated.data;
  const shopDomain = normalizeShopDomain(validated.data.shopDomain);

  const shopify = createShopifyClient(shopDomain, accessToken);

  let validation: ValidateConnectionResult;
  try {
    validation = await shopify.request<ValidateConnectionResult>(
      VALIDATE_CONNECTION_QUERY
    );
  } catch {
    return {
      message:
        "Could not connect — check the store domain and access token and try again.",
    };
  }

  const grantedScopes = new Set(
    validation.currentAppInstallation.accessScopes.map((s) => s.handle)
  );
  const missingScopes = REQUIRED_SCOPES.filter((s) => !grantedScopes.has(s));
  if (missingScopes.length > 0) {
    return {
      message: `Your custom app is missing required scopes: ${missingScopes.join(", ")}. Add them in Shopify admin and reinstall the custom app.`,
    };
  }

  const supabase = await createClient();
  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      organization_id: membership.organization.id,
      shop_domain: shopDomain,
      store_name: validation.shop.name,
      access_token: encrypt(accessToken),
      scopes: Array.from(grantedScopes).join(","),
      webhook_secret: webhookSecret,
      currency: validation.shop.currencyCode,
      timezone: validation.shop.ianaTimezone,
      shopify_plan_name: validation.shop.plan?.displayName ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "This store is already connected to a workspace."
          : error.message,
    };
  }

  // agent_configs is 1:1 with stores and has no client-facing insert policy
  // (only update) — every store needs exactly one row, created here.
  await supabase.from("agent_configs").insert({ store_id: store.id });

  try {
    await registerWebhooks(shopify);
  } catch {
    // Non-fatal — the store is connected and can sync via "Sync now"; webhook
    // registration can be retried later without redoing the whole connection.
  }

  await runFullSync(store.id);

  redirect(`/stores/${store.id}`);
}

export async function disconnectStore(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const storeId = formData.get("storeId") as string;

  // RLS (stores_delete_admin policy) enforces org-admin-only here — no extra
  // check needed since this uses the user-scoped client, not the service role.
  const supabase = await createClient();
  const { error } = await supabase.from("stores").delete().eq("id", storeId);
  if (error) return { message: error.message };

  redirect("/stores");
}

export async function triggerSync(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const storeId = formData.get("storeId") as string;

  // runFullSync uses the service-role client internally (it has to, since
  // products/customers/orders have no client-facing write policies), which
  // bypasses RLS. This select is the authorization check that RLS would
  // otherwise have provided — confirm the caller can actually see this store
  // before doing privileged work on its behalf.
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return { message: "Store not found." };

  try {
    await runFullSync(storeId);
  } catch (err) {
    return {
      message: err instanceof Error ? err.message : "Sync failed.",
    };
  }

  revalidatePath(`/stores/${storeId}`);
  revalidatePath(`/stores/${storeId}/sync`);
  return { message: "Sync complete." };
}
