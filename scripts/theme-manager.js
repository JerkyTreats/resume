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
        this.updateThemeToggle(this.theme);
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
     * Update theme toggle icon
     */
    updateThemeToggle(theme) {
        const toggleButton = document.querySelector('.theme-toggle .nav-icon');
        if (toggleButton) {
            toggleButton.textContent = this.getThemeIcon(theme);
        }
    }

    /**
     * Get emoji icon for theme
     */
    getThemeIcon(theme) {
        return theme === 'dark' ? '☀️' : '🌙';
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
