/**
 * Central redirect configuration.
 *
 * Single source of truth for links to the other BRAND apps. Update the
 * values below when a domain changes (e.g. once real custom domains are
 * bought and DNS is configured) — no other file should ever hardcode
 * these URLs. Brand identity (name, tagline, description) lives
 * separately in js/brand.js.
 */
const LINKS = {
    // Music web app (listener-facing product).
    appUrl: "https://music-app-1-0-0.vercel.app",
    loginUrl: "https://music-app-1-0-0.vercel.app/login",
    signupUrl: "https://music-app-1-0-0.vercel.app/signup",

    // Creator app — a separate deployment from the music app.
    creatorUrl: "https://creator-app-pearl-pi.vercel.app",

    // This marketing website itself (used for canonical / Open Graph tags).
    websiteUrl: "https://musicapp-beta-ten.vercel.app"
};

// Expose globally for use by main.js and inline scripts.
window.LINKS = LINKS;
