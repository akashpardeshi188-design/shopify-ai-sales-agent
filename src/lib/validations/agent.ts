import * as z from "zod";

export const agentConfigSchema = z.object({
  displayName: z.string().trim().min(1, { error: "Enter a display name." }),
  systemPrompt: z
    .string()
    .trim()
    .min(10, { error: "Describe how the agent should behave." }),
  tone: z.enum(["friendly", "professional", "playful", "concise"]),
  welcomeMessage: z.string().trim().min(1, { error: "Enter a welcome message." }),
  temperature: z.coerce.number().min(0).max(2),
  escalationEmail: z
    .union([z.email({ error: "Enter a valid email." }), z.literal("")])
    .optional(),
  isEnabled: z.union([z.literal("on"), z.literal(null)]).transform((v) => v === "on"),
});
