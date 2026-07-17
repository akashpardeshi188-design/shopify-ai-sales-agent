export function welcomeEmail({
  organizationName,
  appUrl,
}: {
  organizationName: string;
  appUrl: string;
}) {
  return {
    subject: `Welcome, ${organizationName} — let's connect your store`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 20px;">Welcome to your AI sales agent</h1>
        <p>Your workspace <strong>${organizationName}</strong> is ready. Next steps:</p>
        <ol>
          <li>Connect your Shopify store</li>
          <li>Index your products so the agent can recommend them</li>
          <li>Configure the agent's persona and tone</li>
          <li>Paste the embed snippet into your theme</li>
        </ol>
        <p><a href="${appUrl}/stores/new">Connect your store →</a></p>
      </div>
    `,
  };
}
