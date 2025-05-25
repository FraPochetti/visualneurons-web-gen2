import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import type { User } from "@/src/types";
import { logger } from "@/src/lib/logger";

export class AuthService {
    async getCurrentUser(): Promise<User | null> {
        try {
            const attributes = await fetchUserAttributes();

            if (!attributes.email) {
                logger.warn("User has no email attribute");
                return null;
            }

            return {
                email: attributes.email,
                identityId: attributes.sub || "",
            };
        } catch (error) {
            logger.error("Failed to get current user", { error });
            return null;
        }
    }

    async logout(): Promise<void> {
        try {
            await signOut();
            logger.info("User logged out successfully");
            window.location.reload();
        } catch (error) {
            logger.error("Logout failed", { error });
            throw error;
        }
    }
}

export const authService = new AuthService(); 