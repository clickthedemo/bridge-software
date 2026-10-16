import type { User } from "@supabase/supabase-js";

import { env } from "../config/index.js";
import { createAdminSupabaseClient } from "../lib/supabase.js";
import type { DevelopmentBootstrapInput } from "../schemas/development-bootstrap.js";

export type DevelopmentBootstrapFailureCode =
    | "DEVELOPMENT_BOOTSTRAP_DISABLED"
    | "DEVELOPMENT_BOOTSTRAP_ALREADY_COMPLETED"
    | "DEVELOPMENT_BOOTSTRAP_FAILED";

export class DevelopmentBootstrapServiceError extends Error {
    constructor(public readonly code: DevelopmentBootstrapFailureCode) {
        super(code);
        this.name = "DevelopmentBootstrapServiceError";
    }
}

export const isDevelopmentBootstrapEnabled = (): boolean =>
    env.NODE_ENV === "development" && env.ENABLE_DEVELOPMENT_BOOTSTRAP;

export const bootstrapDevelopmentAccounts = async (
    input: DevelopmentBootstrapInput
) => {
    if (!isDevelopmentBootstrapEnabled()) {
        throw new DevelopmentBootstrapServiceError(
            "DEVELOPMENT_BOOTSTRAP_DISABLED"
        );
    }

    const client = createAdminSupabaseClient();
    const [{ data: users, error: usersError }, { data: roles, error: rolesError }] =
        await Promise.all([
            client.auth.admin.listUsers({ page: 1, perPage: 100 }),
            client
                .from("user_platform_roles")
                .select("user_id, role")
        ]);

    if (usersError || rolesError) {
        throw new DevelopmentBootstrapServiceError(
            "DEVELOPMENT_BOOTSTRAP_FAILED"
        );
    }

    const createdUserIds: string[] = [];
    try {
        const createAccount = async (
            account: DevelopmentBootstrapInput["administrator"]
        ) => {
            const { data, error } = await client.auth.admin.createUser({
                email: account.email,
                password: account.password,
                email_confirm: true,
                user_metadata: { display_name: account.displayName }
            });
            if (error || !data.user) {
                throw new DevelopmentBootstrapServiceError(
                    "DEVELOPMENT_BOOTSTRAP_FAILED"
                );
            }
            createdUserIds.push(data.user.id);
            return data.user;
        };

        let administrator: User | undefined;
        let member: User | undefined;

        if (users.users.length === 0 && roles.length === 0) {
            administrator = await createAccount(input.administrator);
            member = await createAccount(input.member);
        } else {
            administrator = users.users.find(
                ({ email }) =>
                    email?.toLowerCase() ===
                    input.administrator.email.toLowerCase()
            );
            member = users.users.find(
                ({ email }) =>
                    email?.toLowerCase() === input.member.email.toLowerCase()
            );
            const administratorHasRole = roles.some(
                ({ user_id, role }) =>
                    user_id === administrator?.id && role === "admin"
            );

            if (
                !administrator ||
                !member ||
                !administratorHasRole
            ) {
                throw new DevelopmentBootstrapServiceError(
                    "DEVELOPMENT_BOOTSTRAP_ALREADY_COMPLETED"
                );
            }

            const [administratorUpdate, memberUpdate] = await Promise.all([
                client.auth.admin.updateUserById(administrator.id, {
                    password: input.administrator.password,
                    email_confirm: true,
                    user_metadata: {
                        display_name: input.administrator.displayName
                    }
                }),
                client.auth.admin.updateUserById(member.id, {
                    password: input.member.password,
                    email_confirm: true,
                    user_metadata: { display_name: input.member.displayName }
                })
            ]);
            if (administratorUpdate.error || memberUpdate.error) {
                throw new DevelopmentBootstrapServiceError(
                    "DEVELOPMENT_BOOTSTRAP_FAILED"
                );
            }
        }

        const [administratorProfile, memberProfile, administratorRole] =
            await Promise.all([
                client
                    .from("user_profiles")
                    .update({
                        display_name: input.administrator.displayName,
                        account_type: "standard"
                    })
                    .eq("id", administrator.id)
                    .select("id")
                    .single(),
                client
                    .from("user_profiles")
                    .update({
                        display_name: input.member.displayName,
                        account_type: "standard"
                    })
                    .eq("id", member.id)
                    .select("id")
                    .single(),
                client.from("user_platform_roles").upsert(
                    { user_id: administrator.id, role: "admin" },
                    { onConflict: "user_id,role" }
                )
            ]);

        if (
            administratorProfile.error ||
            memberProfile.error ||
            administratorRole.error
        ) {
            throw new DevelopmentBootstrapServiceError(
                "DEVELOPMENT_BOOTSTRAP_FAILED"
            );
        }

        return {
            administrator: { email: input.administrator.email },
            member: { email: input.member.email }
        };
    } catch (error) {
        await Promise.allSettled(
            createdUserIds.map((userId) => client.auth.admin.deleteUser(userId))
        );
        if (error instanceof DevelopmentBootstrapServiceError) throw error;
        throw new DevelopmentBootstrapServiceError(
            "DEVELOPMENT_BOOTSTRAP_FAILED"
        );
    }
};
