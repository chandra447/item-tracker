import PocketBase from 'pocketbase';

let pb: PocketBase | null = null;

// Create a singleton instance of PocketBase
function getPocketBase() {
    if (typeof window === 'undefined') {
        // Server-side
        return new PocketBase(
            (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) || 'http://127.0.0.1:8090'
        );
    }

    // Client-side
    if (!pb) {
        pb = new PocketBase(
            (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) || 'http://127.0.0.1:8090'
        );

        // Load auth data from localStorage when available
        const authData = localStorage.getItem('pocketbase_auth');
        if (authData) {
            try {
                pb.authStore.save(JSON.parse(authData));
            } catch (error) {
                console.error('Failed to parse auth data:', error);
                localStorage.removeItem('pocketbase_auth');
            }
        }

        // Save auth data to localStorage when it changes
        pb.authStore.onChange(() => {
            if (pb.authStore.isValid) {
                localStorage.setItem('pocketbase_auth', JSON.stringify(pb.authStore.exportToCookie()));
            } else {
                localStorage.removeItem('pocketbase_auth');
            }
        });
    }

    return pb;
}

export default getPocketBase;

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    const pb = getPocketBase();
    return pb.authStore.isValid;
};

// Helper function to get current user
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const pb = getPocketBase();
    return pb.authStore.isValid ? pb.authStore.model : null;
}; 