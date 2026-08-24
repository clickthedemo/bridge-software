import { Router } from "express";

import { authRouter } from "./auth.js";

const router = Router();

router.get("/", (_req, res) => {
    res.status(200).json({
        api: "thebridge",
        version: "v1",
        status: "ok"
    });
});

router.use("/auth", authRouter);

export { router as v1Router };
