"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getClientPocketBase, safeAuthenticate } from "@/lib/pocketbase-client";
import { loginSchema, type LoginFormValues } from "@/lib/auth-schema";
import { showError, showSuccess, showInfo } from "@/lib/toast";
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

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if user was redirected after password reset
        const resetSuccessParam = searchParams.get("resetSuccess");
        if (resetSuccessParam === "true") {
            setResetSuccess(true);
            showSuccess("Password reset successfully! You can now log in with your new password.");
        }
    }, [searchParams]);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            console.log("Sending auth request to PocketBase");
            
            // Use the safe authentication method instead of direct PocketBase call
            const result = await safeAuthenticate(data.email, data.password);
            
            if (result.success) {
                console.log("Login successful", result.data);

                // Verify authentication state after login
                const pb = getClientPocketBase();
                console.log("Auth state after login:", pb.authStore.isValid);
                console.log("Auth token present:", !!pb.authStore.token);

                if (pb.authStore.isValid) {
                    console.log("Redirecting to dashboard");
                    router.push("/dashboard");
                    router.refresh();
                } else {
                    // Add small delay and check auth again
                    await new Promise(resolve => setTimeout(resolve, 100));

                    if (pb.authStore.isValid) {
                        console.log("Auth state valid after delay, redirecting to dashboard");
                        router.push("/dashboard");
                        router.refresh();
                    } else {
                        setError("Login appeared successful but authentication state is invalid");
                        showError("Authentication failed. Please try again.");
                    }
                }
            } else if (result.error) {
                // Handle authentication error
                if (result.error.status === 400) {
                    setError("Invalid email or password");
                    showError("Invalid email or password");
                } else if (result.error.status === 403) {
                    setError("Account is disabled or email not verified");
                    showError("Account is disabled or email not verified");
                } else {
                    setError(`Authentication error: ${result.error.message}`);
                    showError("Authentication failed. Please try again.");
                }
            } else {
                // Fallback error handling
                setError("Authentication failed. Please try again.");
                showError("Authentication failed. Please try again.");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Failed to login. Please try again.");
            showError("Failed to login. Please try again.");
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
                    <CardTitle className="text-2xl">Item Tracker</CardTitle>
                    <CardDescription>
                        Sign in to your account to track item prices
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
                            {error}
                        </div>
                    )}
                    {resetSuccess && (
                        <div className="bg-success/10 text-success text-sm p-2 rounded-md">
                            Password reset successful. Please sign in with your new password.
                        </div>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                autoComplete="email"
                                                disabled={isLoading}
                                                {...field}
                                            />
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
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
                            <div className="text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-muted-foreground hover:text-primary"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign up
                        </Link>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8 ">
                </CardFooter>
            </Card>
        </div>
    );
} 