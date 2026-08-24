export type OrganizationRole = "owner" | "admin" | "reviewer" | "member";

export type MembershipStatus =
    | "active"
    | "invited"
    | "suspended"
    | "removed";

export interface ApplicationProfile {
    displayName: string | null;
    phone: string | null;
}

export interface ApplicationMembership {
    organizationId: string;
    organizationName: string;
    role: OrganizationRole;
    status: MembershipStatus;
}

export interface ApplicationIdentity {
    userId: string;
    email: string | null;
    profile: ApplicationProfile | null;
    memberships: ApplicationMembership[];
}
