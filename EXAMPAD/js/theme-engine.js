/**
 * TESTPAD Theme Engine
 * Applies user preferences globally across the application.
 */
(function () {
    function applyTheme() {
        // Try to get current user ID
        let userId = 'default';
        try {
            const userStr = localStorage.getItem('auth_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user.id;
            }
        } catch (e) { }

        const prefsJson = localStorage.getItem('userPrefs_' + userId);
        if (!prefsJson) return;

        const prefs = JSON.parse(prefsJson);
        const root = document.documentElement;

        // 1. Apply Fonts
        if (prefs.font) {
            root.style.setProperty('--font-main', prefs.font + ', sans-serif');
            document.body.style.fontFamily = prefs.font + ', sans-serif';

            // Inject font link if not present
            const fontUrl = `https://fonts.googleapis.com/css2?family=${prefs.font.replace(' ', '+')}:wght@400;600;700;800&display=swap`;
            if (!document.querySelector(`link[href*="${prefs.font.replace(' ', '+')}"]` || `link[href*="family=${prefs.font.replace(' ', '+')}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fontUrl;
                document.head.appendChild(link);
            }
        }

        // 2. Font Size
        if (prefs.fontSize) {
            const sizes = { small: '12px', normal: '14px', large: '16px', 'xlarge': '18px' };
            root.style.fontSize = sizes[prefs.fontSize] || '14px';
        }

        // 3. Density
        if (prefs.density === 'compact') {
            root.style.setProperty('--spacing-unit', '8px');
            document.body.classList.add('density-compact');
        } else {
            root.style.setProperty('--spacing-unit', '16px');
            document.body.classList.remove('density-compact');
        }

        // 4. Apply Colors
        const themes = {
            orange: { primary: '#F26B3A', dark: '#D45428', soft: '#FFF1EC' },
            blue: { primary: '#2e90fa', dark: '#1570ef', soft: '#eff8ff' },
            dark: { primary: '#101828', dark: '#000000', soft: '#f2f4f7' },
            glass: { primary: '#FF6B6B', dark: '#4ECDC4', soft: 'rgba(255,255,255,0.7)' }
        };

        if (prefs.theme && themes[prefs.theme]) {
            const t = themes[prefs.theme];
            root.style.setProperty('--primary', t.primary);
            root.style.setProperty('--primary-dark', t.dark);
            root.style.setProperty('--primary-soft', t.soft);

            if (prefs.theme === 'dark') {
                root.style.setProperty('--bg-site', '#0a0a0a');
                root.style.setProperty('--text-main', '#ffffff');
                root.style.setProperty('--card-bg', '#1a1a1a');
                root.style.setProperty('--card-border', '#333333');
                document.body.classList.add('theme-dark');
            } else {
                document.body.classList.remove('theme-dark');
                if (prefs.theme === 'glass') {
                    root.style.setProperty('--bg-site', 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)');
                }
            }
        }

        // 5. Apply Accessibility
        if (prefs.contrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        if (prefs.animations === false) {
            document.body.classList.add('no-animations');
            if (!document.getElementById('kill-animations')) {
                const style = document.createElement('style');
                style.id = 'kill-animations';
                style.innerHTML = '* { transition: none !important; animation: none !important; }';
                document.head.appendChild(style);
            }
        } else {
            const style = document.getElementById('kill-animations');
            if (style) style.remove();
        }
    }

    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
        applyTheme();
    }

    window.ThemeEngine = { apply: applyTheme };
})();
