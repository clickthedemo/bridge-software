import { z } from "zod";

export const organizationLocationParamsSchema = z.object({
    organizationId: z.uuid()
});

export const putPrimaryOrganizationLocationSchema = z.object({
    addressLine1: z.string().trim().min(1).max(200),
    addressLine2: z.string().trim().max(200).nullable().optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().max(100).nullable().optional(),
    postalCode: z.string().trim().max(30).nullable().optional(),
    country: z.string().trim().min(2).max(100).default("US")
}).strict();

export type PutPrimaryOrganizationLocationInput = z.infer<
    typeof putPrimaryOrganizationLocationSchema
>;
