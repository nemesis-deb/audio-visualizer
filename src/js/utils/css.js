// src/js/utils/css.js
/**
 * Returns the computed value of a CSS custom property.
 * Example: getCssVar('--theme-primary') => "#00ff88"
 */
export function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
