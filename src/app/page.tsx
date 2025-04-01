"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/pocketbase";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        // Add a small delay to ensure consistent behavior
        await new Promise(resolve => setTimeout(resolve, 100));

        // First check for authentication
        const isLoggedIn = isAuthenticated();
        console.log("Home page auth check:", isLoggedIn);

        if (isLoggedIn) {
          console.log("User is authenticated, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          console.log("User is not authenticated, redirecting to login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error during redirect check:", error);
        // On error, default to login page
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    redirect();
  }, [router]);

  // Return a loading state while we redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-2xl">
        {isChecking ? "Checking authentication..." : "Redirecting..."}
      </div>
    </div>
  );
}
