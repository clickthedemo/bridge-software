import { Router, type Response } from "express";

import { loadApplicationIdentity } from "../../middleware/application-identity.js";
import { requireAuthentication } from "../../middleware/authentication.js";
import { requirePermission } from "../../middleware/authorization.js";
import { validateBody, validateParams } from "../../middleware/validation.js";
import {
    organizationLocationParamsSchema,
    putPrimaryOrganizationLocationSchema,
    type PutPrimaryOrganizationLocationInput
} from "../../schemas/organization-locations.js";
import {
    OrganizationLocationServiceError,
    putPrimaryOrganizationLocation
} from "../../services/organization-locations.js";

const router = Router();
const organizationIdFromParams = (req: { params: { organizationId?: string } }) =>
    req.params.organizationId;

const sendError = (res: Response, error: unknown) => {
    const code = error instanceof OrganizationLocationServiceError
        ? error.code : "INTERNAL_SERVER_ERROR";
    const status = code === "FORBIDDEN" ? 403 : code === "LOCATION_WRITE_FAILED" ? 422 : 500;
    res.status(status).json({
        error: code,
        message: code === "FORBIDDEN"
            ? "You do not have permission to update this organization address."
            : code === "LOCATION_WRITE_FAILED"
                ? "The primary organization address is invalid."
                : "An unexpected error occurred."
    });
};

router.put(
    "/organizations/:organizationId/primary-location",
    requireAuthentication,
    loadApplicationIdentity,
    validateParams(organizationLocationParamsSchema),
    requirePermission("organization:update", organizationIdFromParams),
    validateBody(putPrimaryOrganizationLocationSchema),
    async (req, res) => {
        try {
            const location = await putPrimaryOrganizationLocation(
                req.authentication!.accessToken,
                req.params.organizationId as string,
                req.body as PutPrimaryOrganizationLocationInput
            );
            res.status(200).json({ location });
        } catch (error) {
            sendError(res, error);
        }
    }
);

export { router as organizationLocationsRouter };
