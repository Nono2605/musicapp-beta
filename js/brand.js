/**
 * Central brand configuration.
 *
 * This is the single source of truth for brand identity across the
 * landing page. Update the values below to rebrand the entire site —
 * no other file should ever hardcode the brand name or app URLs.
 */
const BRAND = {
    name: "BRAND",
    shortName: "BRAND",
    tagline: "Your music. Your artists. Your impact.",
    description: "Discover music while supporting the artists you actually listen to through transparent, creator-first royalties.",
    appUrl: "https://app.BRAND.com",
    loginUrl: "https://app.BRAND.com/login",
    signupUrl: "https://app.BRAND.com/signup",
    creatorUrl: "https://app.BRAND.com/creator",
    year: new Date().getFullYear()
};

// Expose globally for use by main.js and inline scripts.
window.BRAND = BRAND;
