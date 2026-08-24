import { Router } from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { resolveApplicationIdentity } from "../../services/application-identity.js";

const router = Router();

router.get("/me", requireAuthentication, async (req, res) => {
    const authentication = req.authentication;

    if (!authentication) {
        res.status(401).json({
            error: "UNAUTHORIZED",
            message: "A valid Bearer access token is required."
        });
        return;
    }

    try {
        const identity = await resolveApplicationIdentity(
            authentication.user,
            authentication.accessToken
        );

        res.status(200).json({
            user: {
                id: identity.userId,
                email: identity.email,
                profile: identity.profile
            },
            memberships: identity.memberships
        });
    } catch {
        res.status(503).json({
            error: "APPLICATION_IDENTITY_UNAVAILABLE",
            message: "Application identity is temporarily unavailable."
        });
    }
});

export { router as authRouter };
