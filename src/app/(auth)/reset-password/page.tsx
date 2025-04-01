"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { confirmPasswordReset } from "@/lib/user-service";
import { getClientPocketBase } from "@/lib/pocketbase-client";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/auth-schema";
import { showSuccess, showError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardTitle, CardDescription, CardContent, CardFooter, CardHeader, Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get token from URL query parameters
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError("Reset token is missing. Please use the link from your email.");
        }
    }, [searchParams]);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            passwordConfirm: "",
        },
    });

    async function onSubmit(data: ResetPasswordFormValues) {
        if (!token) {
            setError("Reset token is missing. Please use the link from your email.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await confirmPasswordReset(
                token,
                data.password,
                data.passwordConfirm
            );
            
            // Clear auth store to log the user out
            const pb = getClientPocketBase();
            pb.authStore.clear();
            
            setSuccess(true);
            showSuccess("Password reset successful! Redirecting to login page...");
            form.reset();

            // Redirect to login after 2 seconds with success message
            setTimeout(() => {
                router.push("/login?resetSuccess=true");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An error occurred while resetting your password.");
            showError(err.message || "An error occurred while resetting your password.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col justify-center items-center">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-md p-2">
                <CardHeader className="space-y-1 text-center pt-4">
                    <div className="flex justify-center mb-2">
                        <Image
                            src="/icons/apple-touch-icon.png"
                            alt="Item Tracker"
                            width={80}
                            height={80}
                            className="rounded-xl"
                        />
                    </div>
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password to complete the reset process
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md mb-6">
                            {error}
                        </div>
                    )}
                    {success ? (
                        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6 text-center">
                            <p className="font-medium">Password reset successfully!</p>
                            <p className="text-sm mt-2">
                                You will be redirected to the login page in a few seconds.
                            </p>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        disabled={isLoading || !token}
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
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
                                                        autoComplete="new-password"
                                                        disabled={isLoading || !token}
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading || !token}>
                                    {isLoading ? "Resetting password..." : "Set New Password"}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8">
                    <div className="text-center text-sm">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Back to login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
} 