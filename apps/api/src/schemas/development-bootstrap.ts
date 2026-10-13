import { z } from "zod";

const bootstrapAccountSchema = z
    .object({
        email: z.email(),
        password: z.string().min(12).max(128),
        displayName: z.string().trim().min(1).max(120)
    })
    .strict();

export const developmentBootstrapSchema = z
    .object({
        administrator: bootstrapAccountSchema,
        member: bootstrapAccountSchema
    })
    .strict()
    .refine(
        ({ administrator, member }) =>
            administrator.email.toLowerCase() !== member.email.toLowerCase(),
        { message: "Bootstrap account emails must be distinct." }
    );

export type DevelopmentBootstrapInput = z.infer<
    typeof developmentBootstrapSchema
>;
