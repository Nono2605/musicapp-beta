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
     * Fictional catalog for the Discover section. Every artist, track
     * and artwork gradient here is an illustrative placeholder.
     */
    var DISCOVER_DATA = {
        "for-you": [
            { track: "Undertow", artist: "Nova Ridge", tag: "For You" },
            { track: "Paper Moons", artist: "Isla Marsh", tag: "For You" },
            { track: "Low Static", artist: "Kite & Wire", tag: "For You" },
            { track: "Amber Line", artist: "Petra Voss", tag: "For You" },
            { track: "Slow Bloom", artist: "Wren Calder", tag: "For You" },
            { track: "Night Currents", artist: "The Low Hum", tag: "For You" }
        ],
        "new-releases": [
            { track: "Halcyon Drift", artist: "Mira Solene", tag: "New" },
            { track: "Glass Atlas", artist: "Signal Fields", tag: "New" },
            { track: "Bone Orchard", artist: "Rue Halden", tag: "New" },
            { track: "Tidewatch", artist: "August Vale", tag: "New" },
            { track: "Paper Skies", artist: "Nia Coast", tag: "New" },
            { track: "Faultlines", artist: "Odder Grove", tag: "New" }
        ],
        "emerging-artists": [
            { track: "Salt & Echo", artist: "Juno Kade", tag: "Emerging" },
            { track: "Corvid Lane", artist: "Ivy Thorne", tag: "Emerging" },
            { track: "Between Stations", artist: "Otto Reyes", tag: "Emerging" },
            { track: "Wildgrass", artist: "Sable Finch", tag: "Emerging" },
            { track: "Neon Orchard", artist: "Lior Bracken", tag: "Emerging" },
            { track: "Quiet Static", artist: "Marlowe Sun", tag: "Emerging" }
        ],
        "trending": [
            { track: "Midnight Freight", artist: "The Low Hum", tag: "Trending" },
            { track: "Afterglow", artist: "Nova Ridge", tag: "Trending" },
            { track: "Electric Hush", artist: "Kite & Wire", tag: "Trending" },
            { track: "Velvet Static", artist: "Petra Voss", tag: "Trending" },
            { track: "Coastline", artist: "Isla Marsh", tag: "Trending" },
            { track: "Fever Dream", artist: "Wren Calder", tag: "Trending" }
        ],
        "ai-music": [
            { track: "Synthetic Bloom", artist: "Aria Engine", tag: "AI" },
            { track: "Neural Tide", artist: "Modelwave", tag: "AI" },
            { track: "Latent Horizon", artist: "Deep Chorus", tag: "AI" },
            { track: "Generated Dusk", artist: "Echo Index", tag: "AI" },
            { track: "Pattern Recognition", artist: "Aria Engine", tag: "AI" },
            { track: "Emergent Field", artist: "Modelwave", tag: "AI" }
        ],
        "human-ai": [
            { track: "Dawn Circuit", artist: "Nova Ridge × Aria Engine", tag: "Human + AI" },
            { track: "Shared Frequency", artist: "Isla Marsh × Modelwave", tag: "Human + AI" },
            { track: "Mirror Take", artist: "Wren Calder × Deep Chorus", tag: "Human + AI" },
            { track: "Cross Signal", artist: "Kite & Wire × Echo Index", tag: "Human + AI" },
            { track: "Human Loop", artist: "Petra Voss × Aria Engine", tag: "Human + AI" },
            { track: "Duet Protocol", artist: "The Low Hum × Modelwave", tag: "Human + AI" }
        ]
    };

    function renderAlbumCard(item, index) {
        var variant = (index % 6) + 1;
        return (
            '<article class="album-card">' +
                '<div class="album-card__art album-card__art--' + variant + '">' +
                    '<button type="button" class="album-card__play" aria-label="Play ' + item.track + ' by ' + item.artist + '">' +
                        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
                    '</button>' +
                    '<span class="album-card__badge">' + item.tag + '</span>' +
                '</div>' +
                '<p class="album-card__track">' + item.track + '</p>' +
                '<p class="album-card__artist">' + item.artist + '</p>' +
            '</article>'
        );
    }

    /**
     * Wires the Discover section's category pills to an ARIA tabs
     * pattern (arrow-key navigation) that swaps the fictional album
     * row below.
     */
    function initDiscover() {
        var tabs = document.querySelectorAll(".discover__tab");
        var row = document.getElementById("discover-panel");
        if (!tabs.length || !row) return;

        function selectTab(tab) {
            tabs.forEach(function (t) {
                var isSelected = t === tab;
                t.setAttribute("aria-selected", isSelected ? "true" : "false");
                t.tabIndex = isSelected ? 0 : -1;
            });

            row.setAttribute("aria-labelledby", tab.id);

            var items = DISCOVER_DATA[tab.getAttribute("data-category")];
            if (items) {
                row.innerHTML = items.map(renderAlbumCard).join("");
            }

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

        if (prefersReducedMotion) {
            el.textContent = prefix + target + suffix;
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
            var value = Math.round(target * easeOutCubic(progress));
            el.textContent = prefix + value + suffix;
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
