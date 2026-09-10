/**
 * Central brand configuration.
 *
 * This is the single source of truth for brand identity across the
 * landing page. Update the values below to rebrand the entire site —
 * no other file should ever hardcode the brand name.
 *
 * Redirect links to the other apps (music app, creator app) live in
 * js/links.js instead, so a domain change never requires touching this
 * file — see also js/api.js for the backend API base URL.
 */
const BRAND = {
    name: "BRAND",
    shortName: "BRAND",
    tagline: "Your music. Your artists. Your impact.",
    description: "Discover music while supporting the artists you actually listen to through transparent, creator-first royalties.",
    year: new Date().getFullYear()
};

// Expose globally for use by main.js and inline scripts.
window.BRAND = BRAND;
