import * as z from "zod";

export const connectStoreSchema = z.object({
  shopDomain: z
    .string()
    .trim()
    .min(1, { error: "Enter your store's domain." }),
  accessToken: z
    .string()
    .trim()
    .min(10, { error: "Enter the Admin API access token from your custom app." }),
  webhookSecret: z
    .string()
    .trim()
    .min(10, { error: "Enter the webhook signing secret from your custom app." }),
});
