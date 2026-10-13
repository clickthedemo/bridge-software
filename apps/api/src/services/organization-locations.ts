import { z } from "zod";

import { createUserScopedSupabaseClient } from "../lib/supabase.js";
import type { PutPrimaryOrganizationLocationInput } from "../schemas/organization-locations.js";

const locationRowSchema = z.object({
    location_id: z.uuid(),
    organization_id: z.uuid(),
    address_line_1: z.string(),
    address_line_2: z.string().nullable(),
    city: z.string(),
    state: z.string().nullable(),
    postal_code: z.string().nullable(),
    country: z.string(),
    updated_at: z.string()
});

export class OrganizationLocationServiceError extends Error {
    constructor(public readonly code: "FORBIDDEN" | "LOCATION_WRITE_FAILED" | "INTERNAL_SERVER_ERROR") {
        super(code);
        this.name = "OrganizationLocationServiceError";
    }
}

export const putPrimaryOrganizationLocation = async (
    accessToken: string,
    organizationId: string,
    input: PutPrimaryOrganizationLocationInput
) => {
    const { data, error } = await createUserScopedSupabaseClient(accessToken)
        .rpc("put_primary_organization_location", {
            p_organization_id: organizationId,
            p_address_line_1: input.addressLine1,
            p_address_line_2: input.addressLine2 ?? null,
            p_city: input.city,
            p_state: input.state ?? null,
            p_postal_code: input.postalCode ?? null,
            p_country: input.country
        })
        .single();

    if (error) {
        if (error.code === "42501") throw new OrganizationLocationServiceError("FORBIDDEN");
        if (error.code === "23514") throw new OrganizationLocationServiceError("LOCATION_WRITE_FAILED");
        throw new OrganizationLocationServiceError("LOCATION_WRITE_FAILED");
    }
    const parsed = locationRowSchema.safeParse(data);
    if (!parsed.success) throw new OrganizationLocationServiceError("INTERNAL_SERVER_ERROR");
    return {
        id: parsed.data.location_id,
        organizationId: parsed.data.organization_id,
        addressLine1: parsed.data.address_line_1,
        addressLine2: parsed.data.address_line_2,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postal_code,
        country: parsed.data.country,
        updatedAt: parsed.data.updated_at
    };
};
