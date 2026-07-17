import { getFromAddress, getResendClient } from "@/lib/resend/client";
import { welcomeEmail } from "@/lib/resend/templates/welcome";
import { escalationEmail } from "@/lib/resend/templates/escalation";
import { paymentFailedEmail, subscriptionCanceledEmail } from "@/lib/resend/templates/billing";

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

// Every sender here swallows its own errors — a failed notification email
// should never take down the signup/chat/webhook flow that triggered it.
async function send(payload: { to: string; subject: string; html: string }) {
  try {
    await getResendClient().emails.send({ from: getFromAddress(), ...payload });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export async function sendWelcomeEmail(to: string, organizationName: string) {
  const { subject, html } = welcomeEmail({ organizationName, appUrl: appUrl() });
  await send({ to, subject, html });
}

export async function sendEscalationEmail(
  to: string,
  params: { storeName: string; conversationId: string; transcript: string }
) {
  const { subject, html } = escalationEmail({
    storeName: params.storeName,
    transcript: params.transcript,
    conversationUrl: `${appUrl()}/conversations/${params.conversationId}`,
  });
  await send({ to, subject, html });
}

export async function sendPaymentFailedEmail(to: string, organizationName: string) {
  const { subject, html } = paymentFailedEmail({ organizationName, billingUrl: `${appUrl()}/billing` });
  await send({ to, subject, html });
}

export async function sendSubscriptionCanceledEmail(to: string, organizationName: string) {
  const { subject, html } = subscriptionCanceledEmail({
    organizationName,
    billingUrl: `${appUrl()}/billing`,
  });
  await send({ to, subject, html });
}
