/**
 * Configuration centrale du site vitrine.
 *
 * Seul endroit où vivent les URLs des autres briques (app auditeur, studio
 * créateur, API). Les liens du HTML les lisent via data-link="<clé>".
 * Changer un domaine = modifier ce fichier, rien d'autre.
 */
window.VYNL = {
  links: {
    app: "https://music-app-1-0-0.vercel.app",
    login: "https://music-app-1-0-0.vercel.app/login",
    signup: "https://music-app-1-0-0.vercel.app/signup",
    creator: "https://creator-app-pearl-pi.vercel.app",
    creatorLogin: "https://creator-app-pearl-pi.vercel.app/login",
    creatorSignup: "https://creator-app-pearl-pi.vercel.app/signup",
  },

  // Le site ne parle qu'à l'API, jamais directement à Supabase.
  apiBase:
    window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://music-app-api-9cjg.onrender.com",
};
