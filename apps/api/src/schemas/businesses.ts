import { z } from "zod";

export const businessOrganizationParamsSchema = z.object({
    organizationId: z.uuid()
});

export const createBusinessSchema = z
    .object({
        legalName: z.string().trim().min(1).max(200),
        dbaName: z.string().trim().min(1).max(200).nullable().optional()
    })
    .strict();

export const businessContactParamsSchema = businessOrganizationParamsSchema.extend({ businessId: z.uuid() });
export const putBusinessContactSchema = z.object({
    email: z.email().trim().max(320),
    phone: z.string().trim().min(7).max(32)
}).strict();

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type PutBusinessContactInput = z.infer<typeof putBusinessContactSchema>;
