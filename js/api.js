/**
 * Central API configuration.
 *
 * Single source of truth for the backend base URL. The site talks to the
 * API only — never directly to Supabase — same contract as the web/mobile
 * app (see documentation/architecture/DATA_FLOW.md).
 */
const API = {
    // Pas de domaine BRAND.com pour l'instant — pointe directement sur
    // musicAPI (Render). À remplacer par https://api.BRAND.com une fois
    // le vrai domaine acheté et le DNS configuré.
    baseUrl: window.location.hostname === "localhost"
        ? "http://localhost:4000"
        : "https://music-app-api-9cjg.onrender.com",

    /**
     * Fetch JSON from a public (unauthenticated) API endpoint.
     * Returns null on any failure so callers can fall back gracefully —
     * this is a marketing site, it must never break because the API is
     * unreachable or the catalog is empty.
     */
    async get(path) {
        try {
            const res = await fetch(API.baseUrl + path);
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.warn("[API] request failed:", path, err);
            return null;
        }
    }
};

window.API = API;
