import type { Request, RequestHandler } from "express";

import type { ApplicationIdentity } from "../types/application-identity.js";

export type Permission =
    | "organization:read"
    | "organization:update"
    | "business:read"
    | "business:update"
    | "verification:read"
    | "verification:review"
    | "document:read"
    | "document:upload"
    | "promotion:create"
    | "promotion:publish"
    | "audit:read";

export interface AuthenticatedRequest extends Request {
    identity?: ApplicationIdentity;
}

export const requirePermission = (
    _permission: Permission
): RequestHandler => {
    return (_req, res, next) => {
        // Milestone 2 contract:
        // concrete permission evaluation is implemented with the
        // authenticated Supabase identity in Milestone 3.
        res.status(501).json({
            error: "NOT_IMPLEMENTED",
            message: "Authorization policy is not implemented yet."
        });
        return;
    };
};
