// Page Guard - Protect admin/mitra pages
// Include this script at the TOP of protected pages

(async function() {
    // Load auth client if not loaded
    if (!window.authClient) {
        const script = document.createElement('script');
        script.src = '/js/auth-client.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    const authClient = window.authClient;
    
    // Get required role from meta tag
    const metaRole = document.querySelector('meta[name="required-role"]');
    const requiredRole = metaRole ? metaRole.content : null;

    // Verify authentication
    const isValid = await authClient.verify();
    
    if (!isValid) {
        // Not authenticated - redirect to login
        if (requiredRole === 'admin') {
            window.location.href = '/admin-login.html';
        } else if (requiredRole === 'mitra') {
            window.location.href = '/mitra-login.html';
        } else {
            window.location.href = '/';
        }
        return;
    }

    // Check role match
    if (requiredRole && authClient.getRole() !== requiredRole) {
        alert('Anda tidak memiliki akses ke halaman ini!');
        window.location.href = '/';
        return;
    }

    // Show page content (remove loading overlay if exists)
    document.body.style.visibility = 'visible';
    
    // Override fetch untuk auto-inject token
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Only inject token for API calls
        if (url.startsWith('/api/admin') || url.startsWith('/api/mitra')) {
            options.headers = {
                ...options.headers,
                'x-auth-token': authClient.getToken()
            };
        }
        return originalFetch(url, options);
    };

    // Add logout button handler if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await authClient.logout();
            window.location.href = '/';
        });
    }
})();
