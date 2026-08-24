import { Router } from "express";

import { requireAuthentication } from "../../middleware/authentication.js";

const router = Router();

router.get("/me", requireAuthentication, (req, res) => {
    const user = req.authenticatedUser;

    if (!user) {
        res.status(401).json({
            error: "UNAUTHORIZED",
            message: "A valid Bearer access token is required."
        });
        return;
    }

    res.status(200).json({
        user: {
            id: user.id,
            email: user.email ?? null,
            emailConfirmedAt: user.email_confirmed_at ?? null,
            lastSignInAt: user.last_sign_in_at ?? null,
            createdAt: user.created_at
        }
    });
});

export { router as authRouter };
