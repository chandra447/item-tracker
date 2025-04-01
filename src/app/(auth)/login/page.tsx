"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getClientPocketBase } from "@/lib/pocketbase-client";
import { loginSchema, type LoginFormValues } from "@/lib/auth-schema";
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
import { PocketBaseStatus } from "@/components/pocketbase-status";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const router = useRouter();

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
        setDebugInfo(null);

        try {
            console.log("Attempting login with:", data.email);

            const pb = getClientPocketBase();

            // Test if we can access the 'users' collection
            try {
                // Test if the collection exists
                console.log("Testing users collection access");
                await pb.collection("users").getList(1, 1);
                console.log("Users collection is accessible");
            } catch (collErr: any) {
                console.error("Cannot access users collection:", collErr);
                setDebugInfo(JSON.stringify({
                    error: "Cannot access users collection",
                    details: collErr.message,
                    status: collErr.status,
                    data: collErr.data || {},
                }, null, 2));
                throw new Error(`Cannot access users collection: ${collErr.message}`);
            }

            // Log current authentication state before login
            console.log("Auth state before login:", pb.authStore.isValid);
            if (pb.authStore.isValid) {
                console.log("Already logged in as:", pb.authStore.model?.email);
                // Clear any existing auth first
                pb.authStore.clear();
            }

            // Attempt to login
            console.log("Sending auth request to PocketBase");
            try {
                const authData = await pb.collection("users").authWithPassword(data.email, data.password);
                console.log("Login successful", authData);

                // The cookie is automatically set by the onChange handler in pocketbase.ts
                // No need to manually set it here

                // Verify authentication state after login
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
                        throw new Error("Login appeared successful but authentication state is invalid");
                    }
                }
            } catch (authErr: any) {
                console.error("Auth error:", authErr);
                if (authErr.status === 400) {
                    setError("Invalid email or password");
                } else {
                    setError(`Authentication error: ${authErr.message}`);
                }

                setDebugInfo(JSON.stringify({
                    error: "Authentication error",
                    details: authErr.message,
                    status: authErr.status,
                    data: authErr.data || {},
                }, null, 2));
                throw authErr; // Re-throw to be caught by the outer try/catch
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to login. Please try again.");

            // Collect debug info for troubleshooting
            try {
                const pb = getClientPocketBase();
                const debugData = {
                    url: process.env.NEXT_PUBLIC_POCKETBASE_URL,
                    authStoreValid: pb.authStore.isValid,
                    error: err.message,
                    errorCode: err.status || 'unknown',
                    data: err.data,
                };
                setDebugInfo(JSON.stringify(debugData, null, 2));
            } catch (debugErr) {
                console.error("Error collecting debug info:", debugErr);
            }
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
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Item Tracker</CardTitle>
                    <CardDescription>
                        Sign in to your account to track item prices
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md mb-6">
                            {error}
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
                                            <Input
                                                placeholder="••••••••"
                                                type="password"
                                                autoComplete="current-password"
                                                disabled={isLoading}
                                                {...field}
                                            />
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

                    {debugInfo && (
                        <div className="mt-4 p-2 bg-muted rounded-md">
                            <details>
                                <summary className="text-xs font-mono cursor-pointer">Debug Info</summary>
                                <pre className="text-xs font-mono overflow-auto mt-2 p-2 bg-background">
                                    {debugInfo}
                                </pre>
                            </details>
                        </div>
                    )}

                    <div className="mt-4">
                        <PocketBaseStatus />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
} 