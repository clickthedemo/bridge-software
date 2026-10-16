import { z } from "zod";

export const businessOrganizationParamsSchema = z.object({
    organizationId: z.uuid()
});

export const createBusinessSchema = z
    .object({
        legalName: z.string().trim().min(1).max(200),
        dbaName: z.string().trim().min(1).max(200).nullable().optional(),
        websiteUrl: z.string().trim().url().regex(/^https:\/\//),
        employeeCount: z.number().int().min(1).max(1_000_000)
    })
    .strict();

export const updateBusinessSchema = z.object({
    websiteUrl: z.string().trim().url().regex(/^https:\/\//),
    employeeCount: z.number().int().min(1).max(1_000_000)
}).strict();

export const businessContactParamsSchema = businessOrganizationParamsSchema.extend({ businessId: z.uuid() });
export const putBusinessContactSchema = z.object({
    email: z.email().trim().max(320),
    phone: z.string().trim().min(7).max(32)
}).strict();

export const businessParamsSchema = businessOrganizationParamsSchema.extend({
    businessId: z.uuid()
});

export const businessLicenseTypeSchema = z.enum(["medical", "adult_use", "dual"]);
export const businessLicenseStatusSchema = z.enum(["pending", "verified", "rejected", "expired", "suspended"]);
export const putBusinessLicenseSchema = z.object({
    licenseNumber: z.string().trim().min(1).max(200),
    licenseType: businessLicenseTypeSchema,
    issuingState: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
    expiresOn: z.iso.date()
}).strict();
export const adminBusinessLicensesQuerySchema = z.object({
    status: businessLicenseStatusSchema.optional()
}).strict();
export const adminBusinessLicenseParamsSchema = z.object({ licenseId: z.uuid() });
export const reviewBusinessLicenseSchema = z.object({
    action: z.enum(["verified", "correction_required", "rejected", "suspended"]),
    reason: z.string().trim().min(1).max(2000).nullable().optional()
}).strict().superRefine((value, context) => {
    if (value.action !== "verified" && !value.reason) {
        context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required." });
    }
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type PutBusinessContactInput = z.infer<typeof putBusinessContactSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type PutBusinessLicenseInput = z.infer<typeof putBusinessLicenseSchema>;
export type ReviewBusinessLicenseInput = z.infer<typeof reviewBusinessLicenseSchema>;
