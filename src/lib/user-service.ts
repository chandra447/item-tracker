import { getClientPocketBase, completeLogout } from "@/lib/pocketbase-client";
import type { User } from "@/lib/types";

export async function logout() {
    completeLogout();
}

export async function resetPassword(oldPassword: string, newPassword: string, newPasswordConfirm: string) {
    const pb = getClientPocketBase();

    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
        throw new Error("You must be logged in to reset your password");
    }

    // Update the password
    const result = await pb.collection("users").update(pb.authStore.model.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPasswordConfirm,
    });
    
    // Clear authentication after password reset
    completeLogout();
    
    return result;
}

export async function requestPasswordReset(email: string) {
    const pb = getClientPocketBase();
    return pb.collection("users").requestPasswordReset(email);
}

export async function confirmPasswordReset(
    resetToken: string,
    newPassword: string,
    newPasswordConfirm: string
) {
    const pb = getClientPocketBase();
    return pb.collection("users").confirmPasswordReset(
        resetToken,
        newPassword,
        newPasswordConfirm
    );
}

export async function getCurrentUserData(): Promise<User | null> {
    const pb = getClientPocketBase();

    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
        return null;
    }

    try {
        return await pb.collection("users").getOne(pb.authStore.model.id);
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
} 