# Task: Create Comprehensive Design System

## Priority: 🟡 HIGH
**Estimated Time:** 8 hours
**Dependencies:** None
**Owner:** [Assign]

## Problem Statement
CSS is scattered across multiple `.module.css` files in pages, violating the core guideline of centralized CSS. Need a single source of truth for all styling.

## Acceptance Criteria
- [ ] Design tokens for colors, spacing, typography, shadows
- [ ] Utility classes for common patterns
- [ ] Component-specific styles in centralized location
- [ ] Dark mode support built-in
- [ ] Responsive breakpoints defined
- [ ] CSS variables for dynamic theming

## Technical Implementation

### 1. Create Design Tokens
```css
/* styles/design-system/tokens.css */
:root {
  /* Colors - Light Mode */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Semantic Colors */
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-surface-elevated: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-border: #e5e7eb;
  --color-border-hover: #d1d5db;
  
  /* Status Colors */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;

  /* Spacing Scale */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* Typography Scale */
  --font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-family-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */
  --font-size-5xl: 3rem;       /* 48px */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Border Radius */
  --radius-sm: 0.125rem;    /* 2px */
  --radius-base: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;    /* 6px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  --radius-2xl: 1rem;       /* 16px */
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;

  /* Z-index Scale */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-overlay: 1200;
  --z-modal: 1300;
  --z-popover: 1400;
  --z-tooltip: 1500;

  /* Breakpoints (for reference in JS) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0f172a;
    --color-surface: #1e293b;
    --color-surface-elevated: #334155;
    --color-text-primary: #f1f5f9;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #94a3b8;
    --color-border: #334155;
    --color-border-hover: #475569;
    
    /* Adjust shadows for dark mode */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.25);
    --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3);
  }
}
```

### 2. Create Utility Classes
```css
/* styles/design-system/utilities.css */

/* Layout Utilities */
.container {
  width: 100%;
  max-width: var(--breakpoint-xl);
  margin-inline: auto;
  padding-inline: var(--space-4);
}

.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-5 { gap: var(--space-5); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }

/* Spacing Utilities */
.m-0 { margin: var(--space-0); }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
/* ... continue for all spacing values ... */

.mt-auto { margin-top: auto; }
.mr-auto { margin-right: auto; }
.mb-auto { margin-bottom: auto; }
.ml-auto { margin-left: auto; }
.mx-auto { margin-inline: auto; }

/* Typography Utilities */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }
.text-4xl { font-size: var(--font-size-4xl); }
.text-5xl { font-size: var(--font-size-5xl); }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }

/* Visual Utilities */
.bg-background { background-color: var(--color-background); }
.bg-surface { background-color: var(--color-surface); }
.bg-primary { background-color: var(--color-primary-500); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border { border: 1px solid var(--color-border); }
.border-2 { border-width: 2px; }
.border-t { border-top: 1px solid var(--color-border); }
.border-r { border-right: 1px solid var(--color-border); }
.border-b { border-bottom: 1px solid var(--color-border); }
.border-l { border-left: 1px solid var(--color-border); }

.rounded-sm { border-radius: var(--radius-sm); }
.rounded { border-radius: var(--radius-base); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }
.rounded-full { border-radius: var(--radius-full); }

.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow { box-shadow: var(--shadow-base); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }

/* State Utilities */
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: var(--transition-base);
}

.hover\:scale-105:hover { transform: scale(1.05); }
.hover\:opacity-80:hover { opacity: 0.8; }

/* Responsive Utilities */
@media (min-width: 640px) {
  .sm\:flex { display: flex; }
  .sm\:hidden { display: none; }
  .sm\:text-lg { font-size: var(--font-size-lg); }
  /* ... add more as needed ... */
}

@media (min-width: 768px) {
  .md\:flex { display: flex; }
  .md\:hidden { display: none; }
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* ... add more as needed ... */
}
```

### 3. Create Component Styles
```css
/* styles/design-system/components.css */

/* Button Component */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  cursor: pointer;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button Variants */
.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-600);
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-surface-elevated);
  border-color: var(--color-border-hover);
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-surface);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-lg);
}

/* Card Component */
.card {
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

/* Form Components */
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-input {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.form-input:disabled {
  background-color: var(--color-surface);
  cursor: not-allowed;
}

/* Alert Component */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.alert-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.alert-info {
  background-color: var(--color-info-light);
  color: var(--color-info);
  border: 1px solid var(--color-info);
}
```

### 4. Create Main Stylesheet
```css
/* styles/main.css */
@import './design-system/tokens.css';
@import './design-system/utilities.css';
@import './design-system/components.css';

/* Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }

p {
  margin: 0 0 var(--space-4) 0;
}

a {
  color: var(--color-primary-500);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}

img,
video {
  max-width: 100%;
  height: auto;
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus Visible */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Loading States */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Print Styles */
@media print {
  body {
    background: white;
    color: black;
  }
  
  .no-print {
    display: none !important;
  }
}
```

### 5. Update Next.js Configuration
```typescript
// pages/_app.tsx
import '@/styles/main.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
```

### 6. Migration Script
```bash
#!/bin/bash
# scripts/migrate-css.sh

# Remove all .module.css files
find pages -name "*.module.css" -type f -delete
find src -name "*.module.css" -type f -delete

# Update imports in components
find pages src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import.*\.module\.css.*//g'

echo "CSS modules removed. Please update component classNames to use design system classes."
```

## Testing Plan
1. Visual regression testing for all pages
2. Verify dark mode works correctly
3. Test responsive breakpoints
4. Check accessibility (contrast ratios, focus states)
5. Performance testing (CSS bundle size)
6. Cross-browser compatibility

## Migration Checklist
- [ ] Remove all `.module.css` imports
- [ ] Update all component classNames
- [ ] Test each page visually
- [ ] Verify no styling is broken
- [ ] Document any custom styles needed

## Documentation
Create a style guide showing:
- Color palette with usage examples
- Typography scale examples
- Component variations
- Spacing system visual guide
- Do's and don'ts for styling

## Next Steps
1. Create Storybook for component documentation
2. Add CSS linting rules
3. Set up visual regression testing
4. Create contribution guidelines for styling 