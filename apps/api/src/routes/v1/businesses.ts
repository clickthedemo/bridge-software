import { Router, type RequestHandler, type Response } from "express";

import { loadApplicationIdentity } from "../../middleware/application-identity.js";
import { requireAuthentication } from "../../middleware/authentication.js";
import { requirePermission } from "../../middleware/authorization.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validation.js";
import {
    adminBusinessLicenseParamsSchema,
    adminBusinessLicensesQuerySchema,
    businessParamsSchema,
    businessOrganizationParamsSchema,
    businessContactParamsSchema,
    createBusinessSchema,
    putBusinessContactSchema,
    putBusinessLicenseSchema,
    reviewBusinessLicenseSchema,
    updateBusinessSchema,
    type PutBusinessLicenseInput,
    type ReviewBusinessLicenseInput,
    type UpdateBusinessInput,
    type PutBusinessContactInput,
    type CreateBusinessInput
} from "../../schemas/businesses.js";
import {
    BusinessServiceError,
    createBusiness,
    getBusinessLicense,
    listAdminBusinessLicenses,
    listBusinesses,
    putBusinessContact,
    putBusinessLicense,
    reviewBusinessLicense,
    updateBusiness
} from "../../services/businesses.js";

const router = Router();
const organizationIdFromParams = (req: {
    params: { organizationId?: string };
}) => req.params.organizationId;

const sendBusinessError = (res: Response, error: unknown): void => {
    if (error instanceof BusinessServiceError) {
        const statuses: Record<BusinessServiceError["code"], number> = {
            BUSINESS_FORBIDDEN: 403, BUSINESS_NOT_FOUND: 404,
            BUSINESS_VALIDATION_FAILED: 422, BUSINESS_LIST_FAILED: 500,
            BUSINESS_CREATE_FAILED: 500, INTERNAL_SERVER_ERROR: 500
        };
        res.status(statuses[error.code]).json({
            error: error.code,
            message: "The business request could not be completed."
        });
        return;
    }

    res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred."
    });
};

export const createListBusinessesHandler = (
    service: typeof listBusinesses = listBusinesses
): RequestHandler => async (req, res) => {
    const authentication = req.authentication;
    if (!authentication) {
        res.status(401).json({
            error: "UNAUTHORIZED",
            message: "A valid authentication credential is required."
        });
        return;
    }

    try {
        const businesses = await service(
            authentication.accessToken,
            req.params.organizationId as string
        );
        res.status(200).json({ businesses });
    } catch (error) {
        sendBusinessError(res, error);
    }
};

export const createCreateBusinessHandler = (
    service: typeof createBusiness = createBusiness
): RequestHandler => async (req, res) => {
    const authentication = req.authentication;
    if (!authentication) {
        res.status(401).json({
            error: "UNAUTHORIZED",
            message: "A valid authentication credential is required."
        });
        return;
    }

    try {
        const business = await service(
            authentication.accessToken,
            req.params.organizationId as string,
            req.body as CreateBusinessInput
        );
        res.status(201).json({ business });
    } catch (error) {
        sendBusinessError(res, error);
    }
};

router.get(
    "/organizations/:organizationId/businesses",
    requireAuthentication,
    loadApplicationIdentity,
    validateParams(businessOrganizationParamsSchema),
    requirePermission("business:read", organizationIdFromParams),
    createListBusinessesHandler()
);

router.patch(
    "/organizations/:organizationId/businesses/:businessId",
    requireAuthentication, loadApplicationIdentity,
    validateParams(businessParamsSchema),
    requirePermission("business:update", organizationIdFromParams),
    validateBody(updateBusinessSchema),
    async (req, res) => {
        try {
            const business = await updateBusiness(req.authentication!.accessToken,
                req.params.organizationId as string, req.params.businessId as string,
                req.body as UpdateBusinessInput);
            res.status(200).json({ business });
        } catch (error) { sendBusinessError(res, error); }
    }
);

router.post(
    "/organizations/:organizationId/businesses",
    requireAuthentication,
    loadApplicationIdentity,
    validateParams(businessOrganizationParamsSchema),
    requirePermission("business:update", organizationIdFromParams),
    validateBody(createBusinessSchema),
    createCreateBusinessHandler()
);

router.put(
    "/organizations/:organizationId/businesses/:businessId/contact",
    requireAuthentication, loadApplicationIdentity,
    validateParams(businessContactParamsSchema),
    requirePermission("business:update", organizationIdFromParams),
    validateBody(putBusinessContactSchema),
    async (req, res) => {
        try {
            const contact = await putBusinessContact(req.authentication!.accessToken, req.params.organizationId as string, req.params.businessId as string, req.body as PutBusinessContactInput);
            res.status(200).json({ contact });
        } catch (error) { sendBusinessError(res, error); }
    }
);

router.get(
    "/organizations/:organizationId/businesses/:businessId/license",
    requireAuthentication, loadApplicationIdentity,
    validateParams(businessParamsSchema),
    requirePermission("business:read", organizationIdFromParams),
    async (req, res) => {
        try {
            const license = await getBusinessLicense(req.authentication!.accessToken,
                req.params.organizationId as string, req.params.businessId as string);
            res.status(200).json({ license });
        } catch (error) { sendBusinessError(res, error); }
    }
);

router.put(
    "/organizations/:organizationId/businesses/:businessId/license",
    requireAuthentication, loadApplicationIdentity,
    validateParams(businessParamsSchema),
    requirePermission("business:update", organizationIdFromParams),
    validateBody(putBusinessLicenseSchema),
    async (req, res) => {
        try {
            const license = await putBusinessLicense(req.authentication!.accessToken,
                req.params.organizationId as string, req.params.businessId as string,
                req.body as PutBusinessLicenseInput);
            res.status(200).json({ license });
        } catch (error) { sendBusinessError(res, error); }
    }
);

router.get(
    "/admin/business-licenses",
    requireAuthentication, loadApplicationIdentity,
    requirePermission("admin:verification_queue"),
    validateQuery(adminBusinessLicensesQuerySchema, "businessLicenseQuery"),
    async (req, res) => {
        try {
            const query = res.locals.businessLicenseQuery as { status?: string };
            const licenses = await listAdminBusinessLicenses(req.authentication!.user.id, query.status);
            res.status(200).json({ licenses });
        } catch (error) { sendBusinessError(res, error); }
    }
);

router.post(
    "/admin/business-licenses/:licenseId/review",
    requireAuthentication, loadApplicationIdentity,
    requirePermission("admin:verification_review"),
    validateParams(adminBusinessLicenseParamsSchema),
    validateBody(reviewBusinessLicenseSchema),
    async (req, res) => {
        try {
            const license = await reviewBusinessLicense(req.authentication!.user.id,
                req.params.licenseId as string, req.body as ReviewBusinessLicenseInput);
            res.status(200).json({ license });
        } catch (error) { sendBusinessError(res, error); }
    }
);

export { router as businessesRouter };
