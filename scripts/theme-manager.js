/**
 * Theme Manager - Handles dark/light mode switching
 * Supports system preference detection and localStorage persistence
 */

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.applyTheme(this.theme);
        this.createThemeToggle();
        this.setupSystemPreferenceListener();
    }

    /**
     * Get stored theme from localStorage
     */
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    /**
     * Store theme preference in localStorage
     */
    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    /**
     * Detect system color scheme preference
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
        this.theme = theme;
        this.setStoredTheme(theme);
        this.updateThemeToggle(theme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Create theme toggle button
     */
    createThemeToggle() {
        // Check if toggle already exists
        if (document.querySelector('.theme-toggle')) {
            return;
        }

        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) {
            return;
        }

        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle dark mode');
        toggleButton.innerHTML = this.getThemeIcon(this.theme);

        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });

        navLinks.appendChild(toggleButton);
    }

    /**
     * Update theme toggle icon
     */
    updateThemeToggle(theme) {
        const toggleButton = document.querySelector('.theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = this.getThemeIcon(theme);
        }
    }

    /**
     * Get SVG icon for theme
     */
    getThemeIcon(theme) {
        if (theme === 'dark') {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            `;
        } else {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            `;
        }
    }

    /**
     * Setup system preference change listener
     */
    setupSystemPreferenceListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!this.getStoredTheme()) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
            }
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.theme;
    }

    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.theme === 'dark';
    }

    /**
     * Check if light mode is active
     */
    isLightMode() {
        return this.theme === 'light';
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
