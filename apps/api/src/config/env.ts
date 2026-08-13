import { z } from "zod";

const optionalString = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional()
);

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    API_PORT: z.coerce.number().int().positive().default(4000),

    API_URL: z.url().default("http://localhost:4000"),

    WEB_URL: z.url().default("http://localhost:5173"),

    SUPABASE_URL: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.url().optional()
    ),

    SUPABASE_ANON_KEY: optionalString,

    SUPABASE_SERVICE_ROLE_KEY: optionalString,

    DATABASE_URL: optionalString,

    EIN_VERIFICATION_PROVIDER: optionalString,

    EIN_VERIFICATION_API_KEY: optionalString
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(z.prettifyError(result.error));
    process.exit(1);
}

export const env = result.data;