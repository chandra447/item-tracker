"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { resetPassword } from "@/lib/user-service";
import { showSuccess, showError } from "@/lib/toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    username: string;
    email: string;
}

// Define the schema for profile password reset
const profileResetSchema = z.object({
    oldPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
});

type ProfileResetFormValues = z.infer<typeof profileResetSchema>;

export function UserProfileDialog({
    open,
    onOpenChange,
    username,
    email,
}: UserProfileDialogProps) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const form = useForm<ProfileResetFormValues>({
        resolver: zodResolver(profileResetSchema),
        defaultValues: {
            oldPassword: "",
            password: "",
            passwordConfirm: "",
        },
    });

    async function onSubmit(data: ProfileResetFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            await resetPassword(data.oldPassword, data.password, data.passwordConfirm);
            setIsResetMode(false);
            onOpenChange(false);
            showSuccess("Password reset successful! Please log in again.");
            // Clear form
            form.reset();
            // Add a small delay before redirecting
            setTimeout(() => {
                router.push("/login");
                router.refresh();
            }, 1500);
        } catch (err: any) {
            // Handle specific error cases
            if (err.status === 400) {
                const errorMessage = "Current password is incorrect";
                setError(errorMessage);
                showError(errorMessage);
            } else if (err.message) {
                setError(err.message);
                showError(err.message);
            } else {
                const errorMessage = "Failed to reset password. Please try again.";
                setError(errorMessage);
                showError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isResetMode ? "Reset Password" : "User Profile"}
                    </DialogTitle>
                    <DialogDescription>
                        {isResetMode
                            ? "Enter your current password and a new password"
                            : "Your profile information"}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md">
                        {error}
                    </div>
                )}

                {!isResetMode ? (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <h3 className="text-sm font-medium">Name</h3>
                            <p className="text-sm">{username}</p>
                        </div>
                        <div className="grid gap-2">
                            <h3 className="text-sm font-medium">Email</h3>
                            <p className="text-sm">{email}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsResetMode(true)}
                        >
                            Reset Password
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="oldPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showNewPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="passwordConfirm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsResetMode(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update Password"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
} 