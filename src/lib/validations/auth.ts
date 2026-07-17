import * as z from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Enter your full name." }),
  email: z.email({ error: "Enter a valid email address." }),
  password: z
    .string()
    .min(8, { error: "Must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Must contain at least one letter." })
    .regex(/[0-9]/, { error: "Must contain at least one number." }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Must contain at least one letter." })
    .regex(/[0-9]/, { error: "Must contain at least one number." }),
});

export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, { error: "Enter your store or business name." }),
});
