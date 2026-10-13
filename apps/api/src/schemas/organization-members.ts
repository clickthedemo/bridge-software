import { z } from "zod";

export const organizationMembersParamsSchema = z.object({
    organizationId: z.uuid()
});

export const organizationMembershipParamsSchema = z.object({
    organizationId: z.uuid(),
    membershipId: z.uuid()
});

export const assignOrganizationMemberSchema = z.object({
    email: z.email().trim().toLowerCase().max(320),
    role: z.enum(["admin", "page_manager", "member"])
}).strict();

export type AssignOrganizationMemberInput = z.infer<typeof assignOrganizationMemberSchema>;
