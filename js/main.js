/**
 * Main site behavior: brand injection, navigation skeleton, footer year.
 * No frameworks — vanilla JS only.
 */
(function () {
    "use strict";

    /**
     * Inject brand text/links into the DOM.
     * Elements use `data-brand="<key>"` for text content
     * and `data-brand-href="<key>"` for the href attribute,
     * where <key> matches a property on the global BRAND object.
     */
    function applyBrand() {
        if (typeof BRAND === "undefined") return;

        document.title = document.title.replace(/BRAND/g, BRAND.name);

        document.querySelectorAll("[data-brand]").forEach(function (el) {
            var key = el.getAttribute("data-brand");
            if (BRAND[key] !== undefined) {
                el.textContent = BRAND[key];
            }
        });

        // Dedicated attribute for the logo/wordmark: <a data-brand-name>.
        document.querySelectorAll("[data-brand-name]").forEach(function (el) {
            el.textContent = BRAND.name;
        });

        document.querySelectorAll("[data-brand-href]").forEach(function (el) {
            var key = el.getAttribute("data-brand-href");
            if (BRAND[key] !== undefined) {
                el.setAttribute("href", BRAND[key]);
            }
        });

        var metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", BRAND.description);
        }

        // Keep Open Graph / Twitter card copy and the JSON-LD block in
        // sync with the brand config, the same way <title> is updated.
        [
            'meta[property="og:site_name"]',
            'meta[property="og:title"]',
            'meta[name="twitter:title"]'
        ].forEach(function (selector) {
            var el = document.querySelector(selector);
            if (el) el.setAttribute("content", el.getAttribute("content").replace(/BRAND/g, BRAND.name));
        });

        [
            'meta[property="og:description"]',
            'meta[name="twitter:description"]'
        ].forEach(function (selector) {
            var el = document.querySelector(selector);
            if (el) el.setAttribute("content", BRAND.description);
        });

        var structuredData = document.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
            try {
                var data = JSON.parse(structuredData.textContent);
                data.name = BRAND.name;
                data.description = BRAND.description;
                structuredData.textContent = JSON.stringify(data);
            } catch (e) {
                /* malformed JSON-LD is a build-time bug, not a runtime concern */
            }
        }
    }

    /**
     * Mobile navigation: hamburger toggle, outside-click dismissal,
     * Escape-to-close, and focus management for keyboard users.
     */
    function initNav() {
        var toggle = document.querySelector(".nav__toggle");
        var menu = document.querySelector(".nav__menu");

        if (!toggle || !menu) return;

        function openMenu() {
            menu.classList.add("nav__menu--open");
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Close navigation menu");
        }

        function closeMenu() {
            menu.classList.remove("nav__menu--open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation menu");
        }

        function isOpen() {
            return menu.classList.contains("nav__menu--open");
        }

        toggle.addEventListener("click", function () {
            if (isOpen()) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        menu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                closeMenu();
            });
        });

        // Close when clicking outside the open menu.
        document.addEventListener("click", function (event) {
            if (!isOpen()) return;
            if (menu.contains(event.target) || toggle.contains(event.target)) return;
            closeMenu();
        });

        // Close on Escape and return focus to the toggle button.
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && isOpen()) {
                closeMenu();
                toggle.focus();
            }
        });
    }

    /**
     * Give the sticky nav a subtle solid background once the page
     * has scrolled, keeping it transparent at rest over the hero.
     */
    function initNavScroll() {
        var header = document.querySelector(".nav");
        if (!header) return;

        var SCROLL_THRESHOLD = 8;

        function updateNavBackground() {
            header.classList.toggle("nav--scrolled", window.scrollY > SCROLL_THRESHOLD);
        }

        updateNavBackground();
        window.addEventListener("scroll", updateNavBackground, { passive: true });
    }

    /**
     * Smooth-scroll to in-page anchors and move focus to the target
     * section for keyboard/screen-reader users. Links to sections
     * that don't exist yet are left as plain anchors (no-op).
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener("click", function (event) {
                var hash = link.getAttribute("href");
                if (!hash || hash === "#") return;

                var target = document.querySelector(hash);
                if (!target) return;

                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });

                if (!target.hasAttribute("tabindex")) {
                    target.setAttribute("tabindex", "-1");
                }
                target.focus({ preventScroll: true });
            });
        });
    }

    /**
     * Fill in the current year in the footer.
     */
    function initFooterYear() {
        var yearEl = document.querySelector("[data-current-year]");
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /**
     * Discover section data, fetched once from the real API (GET /tracks).
     * The API has no per-category filtering yet (for-you/trending/ai-music/...),
     * so every tab currently renders the same live catalog — the tabs stay
     * wired for when the API grows real per-category endpoints.
     */
    var liveTracks = null;

    var SVG_NS = "http://www.w3.org/2000/svg";
    var PLAY_ICON_PATH = "M8 5v14l11-7z";

    function createPlayIcon() {
        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "currentColor");
        svg.setAttribute("aria-hidden", "true");

        var path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", PLAY_ICON_PATH);
        svg.appendChild(path);

        return svg;
    }

    /**
     * Builds one album card as real DOM nodes (no innerHTML) so track
     * and artist names are always inserted as text, never parsed as
     * markup — safe even if a name ever contains "&", "<" or '"'.
     *
     * `item` is a row from GET /tracks: { title, artists: {name}, albums: {cover_url} }.
     * No badge is rendered — the API doesn't classify tracks into
     * for-you/trending/etc. yet, so a per-card label would be fabricated.
     */
    function renderAlbumCard(item, index) {
        var variant = (index % 6) + 1;
        var artistName = (item.artists && item.artists.name) || "Unknown artist";
        var coverUrl = item.albums && item.albums.cover_url;

        var article = document.createElement("article");
        article.className = "album-card";

        var art = document.createElement("div");
        art.className = "album-card__art album-card__art--" + variant;
        if (coverUrl) {
            art.style.backgroundImage = "url(" + coverUrl + ")";
            art.style.backgroundSize = "cover";
            art.style.backgroundPosition = "center";
        }

        var playButton = document.createElement("button");
        playButton.type = "button";
        playButton.className = "album-card__play";
        playButton.setAttribute("aria-label", "Play " + item.title + " by " + artistName);
        playButton.appendChild(createPlayIcon());

        art.appendChild(playButton);

        var track = document.createElement("p");
        track.className = "album-card__track";
        track.textContent = item.title;

        var artist = document.createElement("p");
        artist.className = "album-card__artist";
        artist.textContent = artistName;

        article.appendChild(art);
        article.appendChild(track);
        article.appendChild(artist);

        return article;
    }

    /**
     * Wires the Discover section's category pills to an ARIA tabs
     * pattern (arrow-key navigation). Every tab renders the same live
     * catalog fetched once from the API (see `liveTracks` above).
     */
    function initDiscover() {
        var tabs = document.querySelectorAll(".discover__tab");
        var row = document.getElementById("discover-panel");
        var disclaimer = document.getElementById("discover-disclaimer");
        if (!tabs.length || !row) return;

        function renderRow() {
            row.textContent = "";

            if (liveTracks === null) {
                if (disclaimer) disclaimer.textContent = "Loading catalog…";
                return;
            }

            if (liveTracks.length === 0) {
                if (disclaimer) disclaimer.textContent = "No tracks published yet — check back soon.";
                return;
            }

            if (disclaimer) disclaimer.textContent = "";
            liveTracks.forEach(function (item, index) {
                row.appendChild(renderAlbumCard(item, index));
            });
        }

        function selectTab(tab) {
            tabs.forEach(function (t) {
                var isSelected = t === tab;
                t.setAttribute("aria-selected", isSelected ? "true" : "false");
                t.tabIndex = isSelected ? 0 : -1;
            });

            row.setAttribute("aria-labelledby", tab.id);
            renderRow();
            row.scrollTo({ left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        }

        tabs.forEach(function (tab, index) {
            tab.addEventListener("click", function () {
                selectTab(tab);
            });

            tab.addEventListener("keydown", function (event) {
                var newIndex = null;
                if (event.key === "ArrowRight") newIndex = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") newIndex = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === "Home") newIndex = 0;
                else if (event.key === "End") newIndex = tabs.length - 1;
                if (newIndex === null) return;

                event.preventDefault();
                tabs[newIndex].focus();
                selectTab(tabs[newIndex]);
            });
        });

        renderRow();
        if (typeof API !== "undefined") {
            API.get("/tracks?limit=24").then(function (json) {
                liveTracks = (json && json.data) || [];
                renderRow();
            });
        } else {
            liveTracks = [];
            renderRow();
        }
    }

    /**
     * Animate a number counting up from 0 to `data-count-to` once its
     * element scrolls into view. `data-count-prefix` / `data-count-suffix`
     * (e.g. "€" / "%") are preserved around the animated digits.
     */
    function animateCount(el) {
        var target = parseFloat(el.getAttribute("data-count-to"));
        if (isNaN(target)) return;

        var prefix = el.getAttribute("data-count-prefix") || "";
        var suffix = el.getAttribute("data-count-suffix") || "";
        var decimals = parseInt(el.getAttribute("data-count-decimals"), 10) || 0;

        if (prefersReducedMotion) {
            el.textContent = prefix + target.toFixed(decimals) + suffix;
            return;
        }

        var duration = 1000;
        var start = null;

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function step(timestamp) {
            if (start === null) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            var value = target * easeOutCubic(progress);
            el.textContent = prefix + value.toFixed(decimals) + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    /**
     * Grow a distribution bar from 0 to its `data-bar-to` percentage
     * once it scrolls into view.
     */
    function animateBar(el) {
        var target = parseFloat(el.getAttribute("data-bar-to"));
        if (isNaN(target)) return;

        if (prefersReducedMotion) {
            el.style.transition = "none";
        }

        // Force layout so the width change below always transitions
        // from 0, even if this runs immediately after render.
        requestAnimationFrame(function () {
            el.style.width = target + "%";
        });
    }

    /**
     * Reveal sections, cards and steps as they scroll into view, and
     * trigger the number / bar animations nested inside them.
     */
    function initScrollReveal() {
        var revealEls = document.querySelectorAll(".reveal");
        var stepsTrack = document.querySelector(".steps__track");

        if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
            revealEls.forEach(function (el) {
                el.classList.add("is-visible");
            });
            if (stepsTrack) stepsTrack.classList.add("is-visible");
            document.querySelectorAll("[data-count-to]").forEach(animateCount);
            document.querySelectorAll("[data-bar-to]").forEach(animateBar);
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("is-visible");

                entry.target.querySelectorAll("[data-count-to]").forEach(animateCount);
                entry.target.querySelectorAll("[data-bar-to]").forEach(animateBar);

                obs.unobserve(entry.target);
            });
        }, { threshold: 0.2, rootMargin: "0px 0px -60px 0px" });

        revealEls.forEach(function (el) {
            observer.observe(el);
        });

        if (stepsTrack) {
            var lineObserver = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                });
            }, { threshold: 0.3 });
            lineObserver.observe(stepsTrack);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        applyBrand();
        initNav();
        initNavScroll();
        initSmoothScroll();
        initFooterYear();
        initDiscover();
        initScrollReveal();
    });
})();
