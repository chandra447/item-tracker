import PocketBase from 'pocketbase';

// Cookie name used for authentication
export const AUTH_COOKIE_NAME = 'pb_auth';

// Client-side PocketBase instance
let clientPb: PocketBase | null = null;

/**
 * Get PocketBase instance for client-side use
 */
export function getClientPocketBase() {
    // Only run in browser
    if (typeof window === 'undefined') {
        throw new Error('getClientPocketBase called on server');
    }

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

    if (!clientPb) {
        console.log("[Client] Creating new PocketBase instance");
        clientPb = new PocketBase(pbUrl);

        // Disable auto cancellation to prevent errors when component unmounts during requests
        clientPb.autoCancellation(false);

        // Try to load from cookie first
        const authCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));

        if (authCookie) {
            console.log("[Client] Loading auth from cookie");
            clientPb.authStore.loadFromCookie(authCookie);
        }

        // Set up onChange to store auth in cookie
        clientPb.authStore.onChange(() => {
            console.log("[Client] Auth state changed, isValid:", clientPb?.authStore.isValid);

            if (clientPb?.authStore.isValid) {
                // Save to cookie (HTTP only false to allow access by middleware)
                document.cookie = clientPb.authStore.exportToCookie({
                    httpOnly: false, // Must be false for middleware to read
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax',
                    path: '/'
                });
                console.log("[Client] Auth saved to cookie");
            } else {
                // Clear the cookie when logged out
                document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                console.log("[Client] Auth cookie cleared");
                
                // Also clear localStorage to ensure complete logout
                localStorage.removeItem('pocketbase_auth');
                sessionStorage.removeItem('pocketbase_auth');
                console.log("[Client] Auth storage cleared");
            }
        });

        // Connection check removed to prevent 401 errors
    }

    return clientPb;
}

/**
 * Check if user is authenticated (client-side only)
 */
export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    const pb = getClientPocketBase();
    return pb.authStore.isValid;
};

/**
 * Completely logout and clear all auth data
 */
export const completeLogout = () => {
    if (typeof window === 'undefined') return;
    
    const pb = getClientPocketBase();
    
    // Clear PocketBase auth store
    pb.authStore.clear();
    
    // Clear cookies
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    // Clear any localStorage/sessionStorage items
    localStorage.removeItem('pocketbase_auth');
    sessionStorage.removeItem('pocketbase_auth');
    
    console.log("[Client] Complete logout performed");
};

/**
 * Get current user if authenticated (client-side only)
 */
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const pb = getClientPocketBase();
        if (pb.authStore.isValid) {
            return pb.authStore.model;
        }
        return null;
    } catch (e) {
        console.error("Error getting current user:", e);
        return null;
    }
}; 

/**
 * Safely authenticate with PocketBase without throwing errors to the console
 * @param email User email
 * @param password User password
 * @returns An object with success status and optional data or error
 */
export const safeAuthenticate = async (email: string, password: string) => {
  const pb = getClientPocketBase();
  try {
    const authData = await pb.collection("users").authWithPassword(email, password);
    return { success: true, data: authData };
  } catch (error: any) {
    // Prevent error from propagating to console
    return { 
      success: false, 
      error: {
        status: error.status || 500,
        message: error.message || "Authentication failed"
      }
    };
  }
};