"use client";

import { useState, useEffect } from "react";
import { getClientPocketBase } from "@/lib/pocketbase-client";

export function PocketBaseStatus() {
    const [status, setStatus] = useState<"loading" | "connected" | "error" | "unauthorized">("loading");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<any>(null);

    useEffect(() => {
        async function checkConnection() {
            try {
                const pb = getClientPocketBase();

                // Build connection info
                const connectionInfo = {
                    url: process.env.NEXT_PUBLIC_POCKETBASE_URL,
                    authStatus: pb.authStore.isValid,
                    token: pb.authStore.token ? pb.authStore.token.substring(0, 20) + "..." : null,
                    model: pb.authStore.model ? {
                        id: pb.authStore.model.id,
                        email: pb.authStore.model.email,
                    } : null
                };

                console.log("Current auth status:", pb.authStore.isValid);
                console.log("Auth token:", pb.authStore.token ? "Present" : "None");

                try {
                    // Simple connection test - just fetch the app settings which doesn't require auth
                    const settings = await pb.settings.getAll();
                    console.log("Successfully connected to PocketBase");

                    setInfo({
                        ...connectionInfo,
                        connected: true,
                    });

                    setStatus("connected");
                } catch (connErr: any) {
                    console.error("PocketBase connection error:", connErr);

                    // Check if it's a 401 error (unauthorized) - still means we can connect
                    if (connErr.status === 401) {
                        console.log("Connected but unauthorized (401) - this is normal before login");
                        setStatus("unauthorized");
                        setError("Connected but unauthorized for this endpoint. This is normal before login.");

                        setInfo({
                            ...connectionInfo,
                            connected: true,
                            error: "Unauthorized (401) - this is expected before login",
                        });
                    } else {
                        console.error("Connection failed with status:", connErr.status);
                        setStatus("error");
                        setError(connErr.message || "Unknown error connecting to PocketBase");

                        setInfo({
                            ...connectionInfo,
                            connected: false,
                            error: connErr.message,
                            status: connErr.status,
                            data: connErr.data,
                        });
                    }
                }
            } catch (err: any) {
                console.error("Error in checkConnection:", err);
                setStatus("error");
                setError("Global error: " + (err.message || "Unknown error"));

                setInfo({
                    url: process.env.NEXT_PUBLIC_POCKETBASE_URL,
                    connected: false,
                    error: err.message,
                });
            }
        }

        checkConnection();
    }, []);

    if (status === "loading") {
        return <div className="p-4 text-center">Checking PocketBase connection...</div>;
    }

    if (status === "error") {
        return (
            <div className="p-4 border border-destructive rounded-md">
                <h3 className="font-bold text-destructive">PocketBase Connection Error</h3>
                <p className="text-sm">{error}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Debug Information</summary>
                    <pre className="text-xs mt-2 p-2 bg-muted rounded-md overflow-auto">
                        {JSON.stringify(info, null, 2)}
                    </pre>
                </details>
            </div>
        );
    }

    if (status === "unauthorized") {
        return (
            <div className="p-4 border border-yellow-500 rounded-md">
                <h3 className="font-bold text-yellow-500">PocketBase Connection Limited</h3>
                <p className="text-sm">{error}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Connection Information</summary>
                    <pre className="text-xs mt-2 p-2 bg-muted rounded-md overflow-auto">
                        {JSON.stringify(info, null, 2)}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <div className="p-4 border border-green-500 rounded-md">
            <h3 className="font-bold text-green-500">PocketBase Connected</h3>
            <details className="mt-2">
                <summary className="cursor-pointer text-xs">Connection Information</summary>
                <pre className="text-xs mt-2 p-2 bg-muted rounded-md overflow-auto">
                    {JSON.stringify(info, null, 2)}
                </pre>
            </details>
        </div>
    );
} 