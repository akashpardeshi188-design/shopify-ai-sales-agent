"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  signupSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/resend/send";

export type FormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function login(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);
  if (error) {
    return { message: error.message };
  }

  redirect("/onboarding");
}

export async function signup(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { fullName, email, password } = validated.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${appUrl()}/api/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    return { message: error.message };
  }

  // No session yet means Supabase is waiting on email confirmation.
  if (!data.session) {
    return { message: "Check your email to confirm your account." };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    validated.data.email,
    { redirectTo: `${appUrl()}/api/auth/callback?next=/update-password` }
  );
  if (error) {
    return { message: error.message };
  }

  return { message: "Check your email for a password reset link." };
}

export async function updatePassword(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = updatePasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });
  if (error) {
    return { message: error.message };
  }

  redirect("/dashboard");
}

export async function createOrganization(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = onboardingSchema.safeParse({
    organizationName: formData.get("organizationName"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { organizationName } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization_with_owner", {
    org_name: organizationName,
    org_slug: slugify(organizationName),
  });
  if (error) {
    return { message: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    await sendWelcomeEmail(user.email, organizationName);
  }

  redirect("/dashboard");
}
