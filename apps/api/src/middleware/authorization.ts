import type { Request, RequestHandler } from "express";

export type ProductRole =
    | "brand"
    | "retailer"
    | "dispensary"
    | "sales_rep"
    | "admin";

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

export interface Identity {
    userId: string;
    role: ProductRole;
    organizationIds: string[];
}

export interface AuthenticatedRequest extends Request {
    identity?: Identity;
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
