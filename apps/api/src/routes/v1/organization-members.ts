import { Router, type Response } from "express";

import { loadApplicationIdentity } from "../../middleware/application-identity.js";
import { requireAuthentication } from "../../middleware/authentication.js";
import { requirePermission } from "../../middleware/authorization.js";
import { validateBody, validateParams } from "../../middleware/validation.js";
import {
    assignOrganizationMemberSchema,
    organizationMembershipParamsSchema,
    organizationMembersParamsSchema,
    type AssignOrganizationMemberInput
} from "../../schemas/organization-members.js";
import {
    assignOrganizationMember,
    listOrganizationMembers,
    OrganizationMemberServiceError,
    removeOrganizationMember
} from "../../services/organization-members.js";

const router = Router();
const organizationIdFromParams = (req: { params: { organizationId?: string } }) => req.params.organizationId;

const sendError = (res: Response, error: unknown) => {
    if (!(error instanceof OrganizationMemberServiceError)) {
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." }); return;
    }
    const statuses: Record<OrganizationMemberServiceError["code"], number> = {
        ORGANIZATION_MEMBER_NOT_FOUND: 404,
        ORGANIZATION_MEMBER_FINAL_OWNER: 409,
        ORGANIZATION_MEMBER_FORBIDDEN: 403,
        ORGANIZATION_MEMBER_INVITATION_FAILED: 503,
        ORGANIZATION_MEMBER_READ_FAILED: 500,
        ORGANIZATION_MEMBER_WRITE_FAILED: 500,
        INTERNAL_SERVER_ERROR: 500
    };
    const messages: Record<OrganizationMemberServiceError["code"], string> = {
        ORGANIZATION_MEMBER_NOT_FOUND: "Organization member not found.",
        ORGANIZATION_MEMBER_FINAL_OWNER: "The final organization owner cannot be removed.",
        ORGANIZATION_MEMBER_FORBIDDEN: "You do not have permission to manage this organization's members.",
        ORGANIZATION_MEMBER_INVITATION_FAILED: "The organization invitation could not be sent.",
        ORGANIZATION_MEMBER_READ_FAILED: "Organization members could not be loaded.",
        ORGANIZATION_MEMBER_WRITE_FAILED: "The organization member could not be changed.",
        INTERNAL_SERVER_ERROR: "The organization member request could not be completed."
    };
    res.status(statuses[error.code]).json({ error: error.code, message: messages[error.code] });
};

router.get(
    "/organizations/:organizationId/members",
    requireAuthentication, loadApplicationIdentity,
    validateParams(organizationMembersParamsSchema),
    requirePermission("organization:members_manage", organizationIdFromParams),
    async (req, res) => {
        try { res.status(200).json({ members: await listOrganizationMembers(req.authentication!.accessToken, req.params.organizationId as string) }); }
        catch (error) { sendError(res, error); }
    }
);

router.post(
    "/organizations/:organizationId/members",
    requireAuthentication, loadApplicationIdentity,
    validateParams(organizationMembersParamsSchema),
    requirePermission("organization:members_manage", organizationIdFromParams),
    validateBody(assignOrganizationMemberSchema),
    async (req, res) => {
        try { const result = await assignOrganizationMember(req.authentication!.accessToken, req.params.organizationId as string, req.body as AssignOrganizationMemberInput); res.status(200).json(result); }
        catch (error) { sendError(res, error); }
    }
);

router.delete(
    "/organizations/:organizationId/members/:membershipId",
    requireAuthentication, loadApplicationIdentity,
    validateParams(organizationMembershipParamsSchema),
    requirePermission("organization:members_manage", organizationIdFromParams),
    async (req, res) => {
        try { await removeOrganizationMember(req.authentication!.accessToken, req.params.organizationId as string, req.params.membershipId as string); res.status(204).end(); }
        catch (error) { sendError(res, error); }
    }
);

export { router as organizationMembersRouter };
