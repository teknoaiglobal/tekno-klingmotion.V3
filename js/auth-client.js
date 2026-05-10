// Client-side authentication handler
// Password tidak disimpan di sini - hanya di server!

class AuthClient {
    constructor() {
        this.token = localStorage.getItem('texa_auth_token');
        this.role = localStorage.getItem('texa_auth_role');
    }

    // Hash password di client sebelum kirim ke server
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Login
    async login(password, role) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, role })
            });

            const raw = await response.text();
            let data = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                throw new Error(`Auth API invalid response (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Simpan token di localStorage
            this.token = data.token;
            this.role = data.role;
            localStorage.setItem('texa_auth_token', data.token);
            localStorage.setItem('texa_auth_role', data.role);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Verify token masih valid
    async verify() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: this.token })
            });

            if (!response.ok) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Logout
    async logout() {
        if (this.token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: this.token })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        this.token = null;
        this.role = null;
        localStorage.removeItem('texa_auth_token');
        localStorage.removeItem('texa_auth_role');
        localStorage.removeItem('texa_admin_auth'); // Legacy
        localStorage.removeItem('texa_mitra_auth'); // Legacy
    }

    // Get token untuk API calls
    getToken() {
        return this.token;
    }

    // Get role
    getRole() {
        return this.role;
    }

    // Check if authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Fetch dengan auto-inject token
    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const headers = {
            ...options.headers,
            'x-auth-token': this.token
        };

        const response = await fetch(url, { ...options, headers });

        // Jika 401, logout otomatis
        if (response.status === 401) {
            this.logout();
            window.location.reload();
        }

        return response;
    }
}

// Export singleton instance
window.authClient = new AuthClient();
