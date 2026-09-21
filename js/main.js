/**
 * Comportement du site vitrine — JavaScript natif, aucune dépendance.
 * Tout ce qui suit est une amélioration : sans JS, le site reste lisible.
 */
(function () {
  "use strict";

  var CFG = window.VYNL || { links: {}, apiBase: "" };
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Liens vers les autres apps : data-link="signup" → CFG.links.signup */
  function applyLinks() {
    document.querySelectorAll("[data-link]").forEach(function (el) {
      var url = CFG.links[el.getAttribute("data-link")];
      if (url) el.setAttribute("href", url);
    });
  }

  function applyYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Menu mobile */
  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !toggle) return;

    function setOpen(open) {
      header.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(header.getAttribute("data-open") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.getAttribute("data-open") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  /* Disque : lecture / pause de l'animation (décoratif, aucun son) */
  function initRecord() {
    var record = document.querySelector("[data-record]");
    var button = document.querySelector("[data-record-toggle]");
    if (!record || !button) return;

    function setPlaying(playing) {
      record.classList.toggle("is-playing", playing);
      button.setAttribute("aria-pressed", playing ? "true" : "false");
    }

    // Respect de prefers-reduced-motion : le disque démarre à l'arrêt,
    // et c'est le visiteur qui décide de le lancer.
    setPlaying(!reducedMotion);

    button.addEventListener("click", function () {
      setPlaying(button.getAttribute("aria-pressed") !== "true");
    });
  }

  /* Apparition au défilement */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Catalogue réel : GET /tracks (public). La section reste masquée tant
     que l'API n'a rien renvoyé — le site ne dépend jamais d'elle. */
  function safeImageUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function buildTrack(track) {
    var item = document.createElement("li");
    item.className = "crate__item";

    var disc = document.createElement("div");
    disc.className = "disc";

    var coverUrl = track.albums && track.albums.cover_url ? safeImageUrl(track.albums.cover_url) : null;
    if (coverUrl) {
      var img = document.createElement("img");
      img.src = coverUrl;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      disc.appendChild(img);
    } else {
      disc.classList.add("disc--blank");
    }

    var title = document.createElement("p");
    title.className = "crate__title";
    title.textContent = track.title;
    title.title = track.title;

    var artist = document.createElement("p");
    artist.className = "crate__artist";
    artist.textContent = track.artists && track.artists.name ? track.artists.name : "";

    item.appendChild(disc);
    item.appendChild(title);
    item.appendChild(artist);
    return item;
  }

  function loadCatalog() {
    var section = document.querySelector("[data-catalog]");
    if (!section || !CFG.apiBase || !("fetch" in window)) return;
    var list = section.querySelector("[data-catalog-list]");
    if (!list) return;

    // L'API gratuite de Render peut mettre ~50 s à se réveiller.
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 60000) : null;

    fetch(CFG.apiBase + "/tracks?limit=8", controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (json) {
        var tracks = json && Array.isArray(json.data) ? json.data : [];
        if (!tracks.length) return;
        tracks.forEach(function (track) {
          if (track && typeof track.title === "string") list.appendChild(buildTrack(track));
        });
        if (list.children.length) section.hidden = false;
      })
      .catch(function () {
        /* silencieux : la section reste masquée */
      })
      .then(function () {
        if (timer) clearTimeout(timer);
      });
  }

  applyLinks();
  applyYear();
  initNav();
  initRecord();
  initReveal();
  loadCatalog();
})();
