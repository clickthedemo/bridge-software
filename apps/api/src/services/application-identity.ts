import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { createUserScopedSupabaseClient } from "../lib/supabase.js";
import type { ApplicationIdentity } from "../types/application-identity.js";

const profileSchema = z.object({
    display_name: z.string().nullable(),
    phone: z.string().nullable()
});

const membershipSchema = z.object({
    organization_id: z.uuid(),
    role: z.enum(["owner", "admin", "reviewer", "member"]),
    status: z.literal("active"),
    organizations: z.object({
        id: z.uuid(),
        name: z.string()
    })
});

export class ApplicationIdentityResolutionError extends Error {
    constructor() {
        super("Application identity could not be resolved.");
        this.name = "ApplicationIdentityResolutionError";
    }
}

export const resolveApplicationIdentity = async (
    user: User,
    accessToken: string
): Promise<ApplicationIdentity> => {
    const client = createUserScopedSupabaseClient(accessToken);

    const [profileResult, membershipsResult] = await Promise.all([
        client
            .from("user_profiles")
            .select("display_name, phone")
            .eq("id", user.id)
            .maybeSingle(),
        client
            .from("organization_members")
            .select(
                "organization_id, role, status, organizations!inner(id, name)"
            )
            .eq("user_id", user.id)
            .eq("status", "active")
    ]);

    if (profileResult.error || membershipsResult.error) {
        throw new ApplicationIdentityResolutionError();
    }

    const parsedProfile = profileResult.data
        ? profileSchema.safeParse(profileResult.data)
        : null;
    const parsedMemberships = z
        .array(membershipSchema)
        .safeParse(membershipsResult.data);

    if (
        (parsedProfile && !parsedProfile.success) ||
        !parsedMemberships.success
    ) {
        throw new ApplicationIdentityResolutionError();
    }

    return {
        userId: user.id,
        email: user.email ?? null,
        profile: parsedProfile
            ? {
                  displayName: parsedProfile.data.display_name,
                  phone: parsedProfile.data.phone
              }
            : null,
        memberships: parsedMemberships.data.map((membership) => ({
            organizationId: membership.organization_id,
            organizationName: membership.organizations.name,
            role: membership.role,
            status: membership.status
        }))
    };
};
