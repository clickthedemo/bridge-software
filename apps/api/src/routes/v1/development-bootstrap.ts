import { Router } from "express";

import { validateBody } from "../../middleware/validation.js";
import {
    developmentBootstrapSchema,
    type DevelopmentBootstrapInput
} from "../../schemas/development-bootstrap.js";
import {
    bootstrapDevelopmentAccounts,
    DevelopmentBootstrapServiceError,
    isDevelopmentBootstrapEnabled
} from "../../services/development-bootstrap.js";

const router = Router();

const isLoopback = (address: string | undefined): boolean =>
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1";

router.post(
    "/development/bootstrap",
    validateBody(developmentBootstrapSchema),
    async (req, res) => {
        if (!isDevelopmentBootstrapEnabled() || !isLoopback(req.ip)) {
            res.status(404).json({
                error: "NOT_FOUND",
                message: "The requested resource was not found."
            });
            return;
        }

        try {
            const result = await bootstrapDevelopmentAccounts(
                req.body as DevelopmentBootstrapInput
            );
            res.status(201).json(result);
        } catch (error) {
            const code =
                error instanceof DevelopmentBootstrapServiceError
                    ? error.code
                    : "DEVELOPMENT_BOOTSTRAP_FAILED";
            const status =
                code === "DEVELOPMENT_BOOTSTRAP_ALREADY_COMPLETED" ? 409 : 503;
            res.status(status).json({
                error: code,
                message:
                    status === 409
                        ? "Development bootstrap has already been completed."
                        : "Development bootstrap could not be completed."
            });
        }
    }
);

export { router as developmentBootstrapRouter };
