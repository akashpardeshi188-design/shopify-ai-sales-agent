import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "AI Sales Agent <onboarding@resend.dev>";
}
