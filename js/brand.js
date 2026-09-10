/**
 * Central brand configuration.
 *
 * This is the single source of truth for brand identity across the
 * landing page. Update the values below to rebrand the entire site —
 * no other file should ever hardcode the brand name or app URLs.
 */
// Pas de domaine BRAND.com pour l'instant — pointe directement sur la
// webapp déployée (Vercel). À remplacer par https://app.BRAND.com une
// fois le vrai domaine acheté et le DNS configuré (voir aussi js/api.js).
const APP_BASE_URL = "https://music-app-1-0-0.vercel.app";

const BRAND = {
    name: "BRAND",
    shortName: "BRAND",
    tagline: "Your music. Your artists. Your impact.",
    description: "Discover music while supporting the artists you actually listen to through transparent, creator-first royalties.",
    appUrl: APP_BASE_URL,
    loginUrl: APP_BASE_URL + "/login",
    signupUrl: APP_BASE_URL + "/signup",
    creatorUrl: APP_BASE_URL + "/creator",
    year: new Date().getFullYear()
};

// Expose globally for use by main.js and inline scripts.
window.BRAND = BRAND;
