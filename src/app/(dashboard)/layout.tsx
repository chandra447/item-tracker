"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getCurrentUser } from "@/lib/pocketbase";
import { logout } from "@/lib/user-service";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [username, setUsername] = useState<string>("User");
    const [email, setEmail] = useState<string>("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Add a small delay to ensure consistent behavior
                await new Promise(resolve => setTimeout(resolve, 100));

                // If user is not authenticated, redirect to login
                const authStatus = isAuthenticated();
                console.log("Auth status in DashboardLayout:", authStatus);

                if (!authStatus) {
                    console.log("Redirecting to login from dashboard layout");
                    router.push("/login");
                    return;
                }

                // Get user details
                const user = getCurrentUser();
                console.log("Current user:", user);

                if (user) {
                    setUsername(user.name || "User");
                    setEmail(user.email || "");
                    setIsReady(true);
                } else {
                    setAuthError("Authenticated but unable to get user data");
                    setIsReady(true);
                }
            } catch (error) {
                console.error("Error checking auth:", error);
                setAuthError("Error verifying authentication");
                // If there's an auth error, redirect to login
                router.push("/login");
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        console.log("Logging out...");
        try {
            await logout();
            console.log("Logged out, redirecting to login");
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Error during logout:", error);
            // Force redirect to login even if logout fails
            router.push("/login");
        }
    };

    // Display loading state while checking authentication
    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    // Display error state if there's an authentication issue
    if (authError) {
        return (
            <div className="flex min-h-screen items-center justify-center flex-col gap-4">
                <div className="text-destructive">Authentication Error: {authError}</div>
                <Button onClick={() => router.push("/login")}>Return to Login</Button>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col bg-background">
                <header className="border-b bg-background sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
                        <Link href="/dashboard" className="font-bold text-xl">
                            Item Tracker
                        </Link>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="" alt={username} />
                                            <AvatarFallback>
                                                {username.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <div className="flex flex-col space-y-1 p-2">
                                        <p className="text-sm font-medium leading-none">{username}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {email}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={handleLogout}>
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
                <ScrollToTop />
            </div>
            <UserProfileDialog
                open={isProfileOpen}
                onOpenChange={setIsProfileOpen}
                username={username}
                email={email}
            />
        </>
    );
}