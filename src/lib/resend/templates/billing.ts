export function paymentFailedEmail({
  organizationName,
  billingUrl,
}: {
  organizationName: string;
  billingUrl: string;
}) {
  return {
    subject: `Payment failed for ${organizationName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 18px;">We couldn't process your payment</h1>
        <p>Your most recent invoice for <strong>${organizationName}</strong> failed. Update your payment method to keep your sales agent running without interruption.</p>
        <p><a href="${billingUrl}">Update billing →</a></p>
      </div>
    `,
  };
}

export function subscriptionCanceledEmail({
  organizationName,
  billingUrl,
}: {
  organizationName: string;
  billingUrl: string;
}) {
  return {
    subject: `Your subscription for ${organizationName} was canceled`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 18px;">Subscription canceled</h1>
        <p>The subscription for <strong>${organizationName}</strong> has been canceled. Your storefront widget will stop responding to customers once the current billing period ends.</p>
        <p><a href="${billingUrl}">Resubscribe →</a></p>
      </div>
    `,
  };
}
