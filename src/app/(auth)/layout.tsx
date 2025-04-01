"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/pocketbase";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Add a small delay to ensure consistent behavior
                await new Promise(resolve => setTimeout(resolve, 100));

                // If user is already authenticated, redirect to dashboard
                const authStatus = isAuthenticated();
                console.log("Auth status in AuthLayout:", authStatus);

                if (authStatus) {
                    console.log("Redirecting to dashboard from auth layout");
                    router.push("/dashboard");
                } else {
                    // If not authenticated, we're good to show the auth page
                    setIsReady(true);
                }
            } catch (error) {
                console.error("Error checking auth:", error);
                // If there's an error, still show the auth page
                setIsReady(true);
            }
        };

        checkAuth();
    }, [router]);

    // Display children only once we've checked authentication
    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return <>{children}</>;
} 