import { z } from "zod";

const einSchema = z
    .string()
    .trim()
    .regex(/^[0-9]{2}-?[0-9]{7}$/, "EIN must contain exactly nine digits.")
    .transform((value) => value.replace("-", ""));

export const einIntakeSchema = z.object({ ein: einSchema }).strict();

export const einIntakeParamsSchema = z.object({
    organizationId: z.uuid(),
    businessId: z.uuid()
});

export const einVerificationParamsSchema = z.object({
    verificationItemId: z.uuid()
});

export const einVerificationSchema = z.object({
    mode: z.enum(["mock", "live"]).default("mock"),
    mockOutcome: z.enum(["match", "invalid_tin", "tin_not_issued", "name_mismatch", "invalid_request", "duplicate", "manual_review_6", "manual_review_7", "manual_review_8", "unavailable", "pending", "in_review"]).optional()
}).strict();

export type EinVerificationInput = z.infer<typeof einVerificationSchema>;

export const einRevealParamsSchema = z.object({
    businessId: z.uuid()
});

export type EinIntakeInput = z.infer<typeof einIntakeSchema>;
