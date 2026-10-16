import { z } from "zod";

import { createAdminSupabaseClient, createUserScopedSupabaseClient } from "../lib/supabase.js";
import type { CreateBusinessInput, PutBusinessContactInput, PutBusinessLicenseInput, ReviewBusinessLicenseInput, UpdateBusinessInput } from "../schemas/businesses.js";

const businessRowSchema = z.object({
    id: z.uuid(),
    organization_id: z.uuid(),
    legal_name: z.string(),
    dba_name: z.string().nullable(),
    website_url: z.string().nullable(),
    employee_count: z.number().int().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.string(),
    updated_at: z.string()
});

export type BusinessFailureCode =
    | "BUSINESS_LIST_FAILED"
    | "BUSINESS_CREATE_FAILED"
    | "BUSINESS_FORBIDDEN"
    | "BUSINESS_NOT_FOUND"
    | "BUSINESS_VALIDATION_FAILED"
    | "INTERNAL_SERVER_ERROR";

export class BusinessServiceError extends Error {
    constructor(public readonly code: BusinessFailureCode) {
        super(code);
        this.name = "BusinessServiceError";
    }
}

const throwRpcFailure = (code?: string): never => {
    if (code === "42501") throw new BusinessServiceError("BUSINESS_FORBIDDEN");
    if (code === "P0002") throw new BusinessServiceError("BUSINESS_NOT_FOUND");
    if (code === "23514") throw new BusinessServiceError("BUSINESS_VALIDATION_FAILED");
    throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
};

export interface BusinessResponse {
    id: string;
    organizationId: string;
    legalName: string;
    dbaName: string | null;
    websiteUrl: string | null;
    employeeCount: number | null;
    status: "active" | "inactive" | "archived";
    createdAt: string;
    updatedAt: string;
}

export const projectBusinessRow = (row: unknown): BusinessResponse => {
    const parsed = businessRowSchema.safeParse(row);

    if (!parsed.success) {
        throw new BusinessServiceError("INTERNAL_SERVER_ERROR");
    }

    return {
        id: parsed.data.id,
        organizationId: parsed.data.organization_id,
        legalName: parsed.data.legal_name,
        dbaName: parsed.data.dba_name,
        websiteUrl: parsed.data.website_url,
        employeeCount: parsed.data.employee_count,
        status: parsed.data.status,
        createdAt: parsed.data.created_at,
        updatedAt: parsed.data.updated_at
    };
};

const safeBusinessColumns =
    "id, organization_id, legal_name, dba_name, website_url, employee_count, status, created_at, updated_at";

export const listBusinesses = async (
    accessToken: string,
    organizationId: string
): Promise<BusinessResponse[]> => {
    const client = createUserScopedSupabaseClient(accessToken);
    const { data, error } = await client
        .from("businesses")
        .select(safeBusinessColumns)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new BusinessServiceError("BUSINESS_LIST_FAILED");
    }

    const parsed = z.array(businessRowSchema).safeParse(data);
    if (!parsed.success) {
        throw new BusinessServiceError("INTERNAL_SERVER_ERROR");
    }

    return parsed.data.map(projectBusinessRow);
};

export const createBusiness = async (
    accessToken: string,
    organizationId: string,
    input: CreateBusinessInput
): Promise<BusinessResponse> => {
    const client = createUserScopedSupabaseClient(accessToken);
    const { data, error } = await client
        .from("businesses")
        .insert({
            organization_id: organizationId,
            legal_name: input.legalName,
            dba_name: input.dbaName ?? null,
            website_url: input.websiteUrl,
            employee_count: input.employeeCount
        })
        .select(safeBusinessColumns)
        .single();

    if (error || !data) {
        throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
    }

    return projectBusinessRow(data);
};

export const updateBusiness = async (accessToken: string, organizationId: string, businessId: string, input: UpdateBusinessInput) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken).rpc("update_business_details", {
        p_organization_id: organizationId, p_business_id: businessId,
        p_website_url: input.websiteUrl, p_employee_count: input.employeeCount
    }).single();
    if (error) return throwRpcFailure(error.code);
    if (!data) throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
    return { businessId, websiteUrl: input.websiteUrl, employeeCount: input.employeeCount };
};

const licenseRowSchema = z.object({
    id: z.uuid(), business_id: z.uuid(), organization_id: z.uuid(), license_number: z.string(),
    license_type: z.enum(["medical", "adult_use", "dual"]), issuing_state: z.string(),
    expires_on: z.string(), status: z.enum(["pending", "verified", "rejected", "expired", "suspended"]),
    verified_at: z.string().nullable(), verified_by: z.uuid().nullable(), review_reason: z.string().nullable(),
    created_at: z.string(), updated_at: z.string()
});

const projectLicense = (value: unknown) => {
    const parsed = licenseRowSchema.parse(value);
    return { id: parsed.id, businessId: parsed.business_id, organizationId: parsed.organization_id,
        licenseNumber: parsed.license_number, licenseType: parsed.license_type, issuingState: parsed.issuing_state,
        expiresOn: parsed.expires_on, status: parsed.status, verifiedAt: parsed.verified_at,
        reviewReason: parsed.review_reason, createdAt: parsed.created_at, updatedAt: parsed.updated_at };
};

export const getBusinessLicense = async (accessToken: string, organizationId: string, businessId: string) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken).from("business_licenses").select("*")
        .eq("organization_id", organizationId).eq("business_id", businessId).maybeSingle();
    if (error) throw new BusinessServiceError("BUSINESS_LIST_FAILED");
    return data ? projectLicense(data) : null;
};

export const putBusinessLicense = async (accessToken: string, organizationId: string, businessId: string, input: PutBusinessLicenseInput) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken).rpc("put_business_license", {
        p_organization_id: organizationId, p_business_id: businessId, p_license_number: input.licenseNumber,
        p_license_type: input.licenseType, p_issuing_state: input.issuingState, p_expires_on: input.expiresOn
    });
    if (error) return throwRpcFailure(error.code);
    if (!data) throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
    return projectLicense(data);
};

export const listAdminBusinessLicenses = async (actorUserId: string, status?: string) => {
    const { data, error } = await createAdminSupabaseClient().rpc("list_admin_business_licenses", {
        p_actor_user_id: actorUserId, p_status: status ?? null
    });
    if (error) return throwRpcFailure(error.code);
    return z.array(licenseRowSchema).parse(data).map(projectLicense);
};

export const reviewBusinessLicense = async (actorUserId: string, licenseId: string, input: ReviewBusinessLicenseInput) => {
    const { data, error } = await createAdminSupabaseClient().rpc("review_business_license", {
        p_actor_user_id: actorUserId, p_license_id: licenseId, p_action: input.action, p_reason: input.reason ?? null
    });
    if (error) return throwRpcFailure(error.code);
    if (!data) throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
    return projectLicense(data);
};

export const putBusinessContact = async (accessToken: string, organizationId: string, businessId: string, input: PutBusinessContactInput) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken).rpc("put_business_contact", {
        p_organization_id: organizationId, p_business_id: businessId, p_email: input.email, p_phone: input.phone
    }).single();
    if (error || !data) throw new BusinessServiceError("BUSINESS_CREATE_FAILED");
    const parsed = z.object({ business_id: z.uuid(), contact_email: z.string(), contact_phone: z.string(), updated_at: z.string() }).safeParse(data);
    if (!parsed.success) throw new BusinessServiceError("INTERNAL_SERVER_ERROR");
    return { businessId: parsed.data.business_id, email: parsed.data.contact_email, phone: parsed.data.contact_phone, updatedAt: parsed.data.updated_at };
};
