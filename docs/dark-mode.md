# 🌙 Dark Mode Implementation

## Overview

The resume dashboard now supports dark mode as a first-class citizen with automatic system preference detection and manual theme switching.

## Features

### 🎨 **Theme Support**
- **Light Mode**: Clean, professional appearance with light backgrounds
- **Dark Mode**: Easy on the eyes with dark backgrounds and proper contrast
- **System Preference**: Automatically detects and follows user's system theme preference
- **Manual Override**: Users can manually toggle between light and dark modes

### 🔧 **Technical Implementation**

#### CSS Custom Properties
All colors are now defined using CSS custom properties for consistent theming:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  --accent-primary: #667eea;
  /* ... more properties */
}

[data-theme="dark"] {
  --bg-primary: #1a202c;
  --text-primary: #f7fafc;
  --accent-primary: #667eea;
  /* ... dark mode variants */
}
```

#### System Preference Detection
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Dark mode colors */
  }
}
```

#### Smooth Transitions
All theme changes include smooth transitions for a polished user experience:
```css
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
```

### 🎯 **User Experience**

#### Theme Toggle Button
- Located in the navigation bar
- Shows sun icon in dark mode, moon icon in light mode
- Smooth hover effects and transitions
- Accessible with proper ARIA labels

#### Automatic Detection
- Detects system preference on page load
- Respects user's manual override
- Updates automatically when system preference changes (if no manual override)

#### Persistence
- Theme preference is stored in localStorage
- Remembers user's choice across sessions
- Falls back to system preference if no stored preference

### 📱 **Responsive Design**
- Dark mode works seamlessly across all screen sizes
- Navigation and dashboard adapt to theme changes
- Resume template remains unchanged (as requested)

### 🎨 **Color Palette**

#### Light Mode Colors
- Background: `#ffffff` (white)
- Text Primary: `#333333` (dark gray)
- Text Secondary: `#4a5568` (medium gray)
- Accent: `#667eea` (blue gradient)
- Borders: `#e2e8f0` (light gray)

#### Dark Mode Colors
- Background: `#1a202c` (dark blue-gray)
- Text Primary: `#f7fafc` (off-white)
- Text Secondary: `#e2e8f0` (light gray)
- Accent: `#667eea` (same blue gradient)
- Borders: `#2d3748` (medium gray)

### 🔧 **Implementation Details**

#### Files Modified
- `styles/shared.css` - Added CSS custom properties and dark mode variants
- `dashboard/styles.css` - Updated to use CSS custom properties
- `scripts/theme-manager.js` - New theme management system
- `dashboard/index.html` - Added theme manager script and navigation links
- `resume.html` - Added theme manager script and navigation links
- `index.html` - Added shared CSS for consistent theming

#### Files Preserved
- `resume.css` - Resume template styling remains unchanged as requested

### 🚀 **Usage**

#### For Users
1. **Automatic**: The site will automatically match your system theme preference
2. **Manual Toggle**: Click the theme toggle button in the navigation bar
3. **Persistence**: Your choice is remembered across sessions

#### For Developers
```javascript
// Access theme manager
window.themeManager.toggleTheme();
window.themeManager.getCurrentTheme();
window.themeManager.isDarkMode();
```

### 🎯 **Accessibility**
- High contrast ratios in both themes
- Proper ARIA labels for theme toggle
- Keyboard navigation support
- Screen reader friendly

### 🔮 **Future Enhancements**
- Custom theme colors
- Animation preferences
- Font size adjustments
- High contrast mode

## Browser Support
- Modern browsers with CSS custom properties support
- Graceful fallback to light mode for older browsers
- System preference detection requires modern browser APIs
