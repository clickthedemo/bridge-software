import { z } from "zod";

import { createAdminSupabaseClient, createUserScopedSupabaseClient } from "../lib/supabase.js";
import type { AssignOrganizationMemberInput } from "../schemas/organization-members.js";

const memberRowSchema = z.object({
    membership_id: z.uuid(),
    user_id: z.uuid(),
    email: z.email().optional(),
    display_name: z.string().nullable().optional(),
    role: z.enum(["owner", "admin", "page_manager", "reviewer", "member"]),
    status: z.enum(["active", "invited", "suspended", "removed"]),
    created_at: z.string(),
    updated_at: z.string()
});

export type OrganizationMemberFailureCode =
    | "ORGANIZATION_MEMBER_NOT_FOUND"
    | "ORGANIZATION_MEMBER_FINAL_OWNER"
    | "ORGANIZATION_MEMBER_FORBIDDEN"
    | "ORGANIZATION_MEMBER_INVITATION_FAILED"
    | "ORGANIZATION_MEMBER_READ_FAILED"
    | "ORGANIZATION_MEMBER_WRITE_FAILED"
    | "INTERNAL_SERVER_ERROR";

export class OrganizationMemberServiceError extends Error {
    constructor(public readonly code: OrganizationMemberFailureCode) {
        super(code);
        this.name = "OrganizationMemberServiceError";
    }
}

export interface OrganizationMemberResponse {
    id: string;
    userId: string;
    email: string;
    displayName: string | null;
    role: "owner" | "admin" | "page_manager" | "reviewer" | "member";
    status: "active" | "invited" | "suspended" | "removed";
    createdAt: string;
    updatedAt: string;
}

const projectMember = (row: unknown): OrganizationMemberResponse => {
    const parsed = memberRowSchema.safeParse(row);
    if (!parsed.success || !parsed.data.email) {
        throw new OrganizationMemberServiceError("INTERNAL_SERVER_ERROR");
    }
    return {
        id: parsed.data.membership_id,
        userId: parsed.data.user_id,
        email: parsed.data.email,
        displayName: parsed.data.display_name ?? null,
        role: parsed.data.role,
        status: parsed.data.status,
        createdAt: parsed.data.created_at,
        updatedAt: parsed.data.updated_at
    };
};

const mapRpcError = (code: string | undefined): never => {
    if (code === "42501") throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_FORBIDDEN");
    if (code === "P0002") throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_NOT_FOUND");
    if (code === "55000") throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_FINAL_OWNER");
    throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_WRITE_FAILED");
};

export const listOrganizationMembers = async (accessToken: string, organizationId: string) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken)
        .rpc("list_organization_members", { p_organization_id: organizationId });
    if (error) {
        if (error.code === "42501") throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_FORBIDDEN");
        throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_READ_FAILED");
    }
    const parsed = z.array(memberRowSchema).safeParse(data ?? []);
    if (!parsed.success) throw new OrganizationMemberServiceError("INTERNAL_SERVER_ERROR");
    return parsed.data.map(projectMember);
};

const resolveOrInviteUser = async (email: string) => {
    const admin = createAdminSupabaseClient();
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listed.error) throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_INVITATION_FAILED");
    const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email);
    if (existing) return { user: existing, invitationSent: false };
    const invited = await admin.auth.admin.inviteUserByEmail(email);
    if (invited.error || !invited.data.user) {
        throw new OrganizationMemberServiceError("ORGANIZATION_MEMBER_INVITATION_FAILED");
    }
    return { user: invited.data.user, invitationSent: true };
};

export const assignOrganizationMember = async (
    accessToken: string,
    organizationId: string,
    input: AssignOrganizationMemberInput
) => {
    const resolved = await resolveOrInviteUser(input.email);
    const client = createUserScopedSupabaseClient(accessToken);
    const { error } = await client.rpc("assign_organization_member", {
        p_organization_id: organizationId,
        p_target_user_id: resolved.user.id,
        p_role: input.role
    });
    if (error) {
        if (resolved.invitationSent) {
            await createAdminSupabaseClient().auth.admin.deleteUser(resolved.user.id);
        }
        return mapRpcError(error.code);
    }
    const members = await listOrganizationMembers(accessToken, organizationId);
    const member = members.find((candidate) => candidate.userId === resolved.user.id);
    if (!member) throw new OrganizationMemberServiceError("INTERNAL_SERVER_ERROR");
    return { member, invitationSent: resolved.invitationSent };
};

export const removeOrganizationMember = async (
    accessToken: string,
    organizationId: string,
    membershipId: string
) => {
    const { error } = await createUserScopedSupabaseClient(accessToken)
        .rpc("remove_organization_member", {
            p_organization_id: organizationId,
            p_membership_id: membershipId
        });
    if (error) return mapRpcError(error.code);
};
