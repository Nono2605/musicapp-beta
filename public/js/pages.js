const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('ngrok-skip-browser-warning', 'true');
    return nativeFetch(input, { ...options, headers });
};

function renderSharedNavigation(user) {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const playlists = document.querySelector('.playlists');
    if (playlists && user) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        playlists.innerHTML = `
            <h3>Votre compte</h3>
            <ul class="playlist-links">
                <li class="${currentPage === 'profile.html' ? 'active' : ''}"><a href="profile.html">Profil</a></li>
                <li class="${currentPage === 'abonnement.html' ? 'active' : ''}"><a href="abonnement.html">Abonnement</a></li>
            </ul>
        `;
    } else if (playlists) {
        playlists.hidden = true;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const homeLink = user ? 'landing.html' : 'index.html';
    const links = [
        [homeLink, 'fa-home', 'Accueil'],
        ['search.html', 'fa-search', 'Rechercher'],
        ['premium.html', 'fa-crown', 'Premium'],
    ];

    if (user) {
        links.splice(2, 0, ['library.html', 'fa-book-open', 'Bibliothèque']);
        links.push(['profile.html', 'fa-user', 'Mon profil']);
    } else {
        links.push(['index.html?auth=login', 'fa-sign-in-alt', 'Se connecter']);
        links.push(['index.html?auth=signup', 'fa-user-plus', "S'inscrire"]);
    }

    navLinks.innerHTML = links.map(([href, icon, label]) => {
        const active = href === currentPage ? ' class="active"' : '';
        const authClass = href.includes('?auth=') ? ' class="auth-trigger"' : '';
        return `<li${active}><a href="${href}"${authClass}><i class="fas ${icon}"></i> ${label}</a></li>`;
    }).join('');
}

function setupMobileNavigation() {
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    if (!header || !sidebar || document.querySelector('.mobile-menu-toggle')) return;

    const toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    header.querySelector('.nav-buttons').prepend(toggle);

    const closeMenu = () => {
        document.body.classList.remove('mobile-menu-open');
        toggle.setAttribute('aria-label', 'Ouvrir le menu');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
    };
    toggle.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('mobile-menu-open');
        toggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
        toggle.innerHTML = `<i class="fas fa-${isOpen ? 'times' : 'bars'}"></i>`;
    });
    sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
    document.body.addEventListener('click', event => {
        if (document.body.classList.contains('mobile-menu-open') && event.target === document.body) closeMenu();
    });
}

async function setupProfilePage(user) {
    if (!user || !document.querySelector('.profile-header')) return;

    const API_URL = '/api';
    const settingsPanel = document.querySelector('.settings-panel');
    const profileHeader = document.querySelector('.profile-header');
    if (!settingsPanel || document.getElementById('profile-editor')) return;

    const fallbackIcon = profileHeader.querySelector('.large-profile-icon');
    if (fallbackIcon) fallbackIcon.style.display = 'none';
    profileHeader.insertAdjacentHTML('afterbegin', '<img class="profile-avatar" id="profile-avatar" alt="Photo de profil">');
    profileHeader.insertAdjacentHTML('beforeend', '<button class="secondary-button edit-profile-button" id="edit-profile-button">Modifier les informations</button>');
    settingsPanel.insertAdjacentHTML('beforebegin', `
        <section class="profile-editor hidden" id="profile-editor">
            <div class="section-title-row"><h3>Informations personnelles</h3><span class="muted-label">Modifiables</span></div>
            <form id="profile-form" class="profile-form">
                <label>Photo de profil<input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp"></label>
                <label>Pseudo<input id="profile-username" type="text" maxlength="50" required></label>
                <label>Email<input id="profile-email-input" type="email" maxlength="255" required></label>
                <label>Description<textarea id="profile-bio" maxlength="280" placeholder="Parlez un peu de vous..."></textarea></label>
                <button class="btn-submit" type="submit">Enregistrer les modifications</button>
                <p class="form-message" id="profile-message" aria-live="polite"></p>
            </form>
            <div class="profile-stats" id="profile-stats"></div>
        </section>
        <section class="profile-editor follow-section">
            <div class="section-title-row"><h3>Découvrir des utilisateurs</h3><span class="muted-label">Suivre la communauté</span></div>
            <input class="user-search" id="user-search" type="search" placeholder="Rechercher un pseudo">
            <div class="user-results" id="user-results"></div>
        </section>
    `);

    const form = document.getElementById('profile-form');
    const photoInput = document.getElementById('profile-photo');
    const avatar = document.getElementById('profile-avatar');
    const message = document.getElementById('profile-message');
    const usernameInput = document.getElementById('profile-username');
    const emailInput = document.getElementById('profile-email-input');
    const bioInput = document.getElementById('profile-bio');
    const editor = document.getElementById('profile-editor');
    const editButton = document.getElementById('edit-profile-button');
    editButton.addEventListener('click', () => {
        editor.classList.toggle('hidden');
        editButton.textContent = editor.classList.contains('hidden') ? 'Modifier les informations' : 'Fermer la modification';
    });

    function renderProfile(profile) {
        usernameInput.value = profile.username || '';
        emailInput.value = profile.email || '';
        bioInput.value = profile.description || '';
        avatar.src = profile.avatar_url || 'https://via.placeholder.com/110/3c805e/ffffff?text=%F0%9F%8E%B5';
        document.getElementById('profile-name').textContent = profile.username;
        document.getElementById('profile-email').textContent = profile.email;
        let bioDisplay = document.getElementById('profile-bio-display');
        if (!bioDisplay) {
            bioDisplay = document.createElement('p');
            bioDisplay.id = 'profile-bio-display';
            profileHeader.querySelector('div').appendChild(bioDisplay);
        }
        bioDisplay.textContent = profile.description || 'Aucune description pour le moment.';
        document.getElementById('profile-stats').innerHTML = `<strong>${profile.followers_count || 0}</strong> followers <span></span> <strong>${profile.following_count || 0}</strong> abonnements`;
    }

    try {
        const response = await fetch(`${API_URL}/users/${user.id}`);
        renderProfile(await response.json());
    } catch (error) {
        renderProfile(user);
    }

    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { avatar.src = reader.result; };
        reader.readAsDataURL(file);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';
        message.textContent = '';

        try {
            const response = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput.value, email: emailInput.value, description: bioInput.value, avatarUrl: avatar.src })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Mise à jour impossible.');

            localStorage.setItem('soundwave_user', JSON.stringify(data));
            renderProfile(data);
            const profileButton = document.querySelector('.btn-upgrade');
            if (profileButton) profileButton.textContent = data.username;
            message.textContent = 'Profil mis à jour avec succès.';
            editor.classList.add('hidden');
            editButton.textContent = 'Modifier les informations';
        } catch (error) {
            message.textContent = error.message || 'Impossible de joindre le serveur.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enregistrer les modifications';
        }
    });

    const results = document.getElementById('user-results');
    document.getElementById('user-search').addEventListener('input', async (event) => {
        const response = await fetch(`${API_URL}/users?search=${encodeURIComponent(event.target.value)}`);
        const users = await response.json();
        results.innerHTML = '';
        users.filter(item => String(item.id) !== String(user.id)).forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-result';
            row.innerHTML = `<span><strong>${item.username}</strong><small>${item.followers_count || 0} followers</small></span><button class="secondary-button follow-button" data-user-id="${item.id}">Suivre</button>`;
            row.querySelector('button').addEventListener('click', async () => {
                const followResponse = await fetch(`${API_URL}/users/${item.id}/follow`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followerId: user.id })
                });
                row.querySelector('button').textContent = followResponse.ok ? 'Suivi' : 'Déjà suivi';
            });
            results.appendChild(row);
        });
    });
}

async function setupLibraryPage(user) {
    const trackList = document.querySelector('.track-list');
    if (!trackList) return;

    if (!user) {
        trackList.innerHTML = '<div class="empty-library"><i class="fas fa-lock"></i><strong>Connectez-vous pour voir votre bibliothèque</strong><span>Vos titres enregistrés apparaîtront ici.</span></div>';
        return;
    }

    const API_URL = '/api';
    try {
        const response = await fetch(`${API_URL}/users/${user.id}/library`);
        const tracks = await response.json();
        trackList.innerHTML = '';

        if (!tracks.length) {
            trackList.innerHTML = '<div class="empty-library"><i class="fas fa-headphones"></i><strong>Votre bibliothèque est vide</strong><span>Ajoutez vos titres préférés depuis l’accueil.</span></div>';
            return;
        }

        tracks.forEach(track => {
            const row = document.createElement('div');
            row.className = 'track-row';
            row.innerHTML = `
                <img src="${track.cover_url || 'https://picsum.photos/seed/library-default/64'}" alt="${track.title}">
                <span class="track-number"><i class="fas fa-heart"></i></span>
                <div><strong>${track.title}</strong><small>${track.artist}</small></div>
                <span class="track-duration">${track.duration || '--:--'}</span>
                <button class="remove-track" title="Retirer de la bibliothèque"><i class="fas fa-trash"></i></button>
            `;
            row.querySelector('.remove-track').addEventListener('click', async () => {
                await fetch(`${API_URL}/users/${user.id}/library/${encodeURIComponent(track.track_id)}`, { method: 'DELETE' });
                row.remove();
                if (!trackList.children.length) trackList.innerHTML = '<div class="empty-library"><i class="fas fa-headphones"></i><strong>Votre bibliothèque est vide</strong><span>Ajoutez vos titres préférés depuis l’accueil.</span></div>';
            });
            trackList.appendChild(row);
        });
    } catch (error) {
        trackList.innerHTML = '<div class="empty-library"><strong>Bibliothèque indisponible</strong><span>Vérifiez que le serveur est démarré.</span></div>';
    }
}

function setupEmptyCollectionPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const emptyStates = {
        'albums.html': ['.card-grid', 'fa-compact-disc', 'Aucun album enregistré', 'Les albums ajoutés à votre collection apparaîtront ici.'],
        'artists.html': ['.artist-grid', 'fa-users', 'Aucun artiste suivi', 'Les artistes que vous suivrez apparaîtront ici.'],
        'playlists.html': ['.playlist-grid', 'fa-list', 'Aucune playlist créée', 'Créez une playlist pour organiser vos titres préférés.']
    };
    const state = emptyStates[currentPage];
    if (!state) return;
    const container = document.querySelector(state[0]);
    if (container) container.innerHTML = `<div class="empty-library"><i class="fas ${state[1]}"></i><strong>${state[2]}</strong><span>${state[3]}</span></div>`;
}

function setupLibraryTabs() {
    const tabs = document.querySelector('.library-tabs');
    if (!tabs) return;
    const currentPage = window.location.pathname.split('/').pop() || 'library.html';
    tabs.innerHTML = [
        ['library.html', 'Titres'],
        ['albums.html', 'Albums'],
        ['artists.html', 'Artistes'],
        ['playlists.html', 'Playlists']
    ].map(([href, label]) => `<a class="library-tab ${href === currentPage ? 'active' : ''}" href="${href}">${label}</a>`).join('');
}

function setupQuickAccessLinks(user) {
    if (document.querySelector('.page-quick-access-list')) return;
    const quickAccess = document.createElement('div');
    quickAccess.className = 'page-quick-access-list';
    
    const remunerationHref = user ? 'remuneration.html' : 'remuneration-public.html';
    
    quickAccess.innerHTML = `
        <a class="page-quick-access" href="creator.html" aria-label="Accéder au Studio Sonovia Creator">
            <i class="fas fa-microphone-lines"></i><span>Creator</span>
        </a>
        <a class="page-quick-access" href="${remunerationHref}" aria-label="Voir la rémunération des artistes">
            <i class="fas fa-coins"></i><span>Rémunération</span>
        </a>
    `;
    document.body.appendChild(quickAccess);
}

function setupSearchPage() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    const renderResults = tracks => {
        if (!tracks.length) {
            results.innerHTML = '<div class="empty-library"><i class="fas fa-music"></i><strong>Aucun morceau disponible</strong><span>Le catalogue ne contient pas encore de musique correspondant à votre recherche.</span></div>';
            return;
        }
        results.innerHTML = tracks.map(track => `
            <article class="card">
                <img src="${track.cover_url || 'https://via.placeholder.com/200/1b1b1b/ffffff?text=Sonovia'}" alt="${track.title}">
                <h4>${track.title}</h4>
                <p>${track.artist}${track.album ? ` · ${track.album}` : ''}</p>
                <small class="track-meta">${track.genre || 'Genre non renseigné'}${track.style ? ` · ${track.style}` : ''}</small>
            </article>
        `).join('');
    };

    const loadTracks = async () => {
        try {
            const response = await fetch(`/api/tracks?search=${encodeURIComponent(input.value)}`);
            renderResults(await response.json());
        } catch (error) {
            renderResults([]);
        }
    };

    input.addEventListener('input', loadTracks);
    loadTracks();
}

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.querySelector('.play-btn');
    if (playButton) {
        playButton.addEventListener('click', () => {
            playButton.classList.toggle('fa-play-circle');
            playButton.classList.toggle('fa-pause-circle');
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            document.querySelectorAll('.compact-grid .card').forEach(card => {
                card.hidden = query && !card.textContent.toLowerCase().includes(query);
            });
        });
    }

    const user = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
    document.body.classList.toggle('visitor-mode', !user);
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = new Set(['landing.html', 'library.html', 'profile.html', 'abonnement.html', 'creator.html']);
    if (!user && protectedPages.has(currentPage)) {
        window.location.replace('index.html?auth=login');
        return;
    }
    setupQuickAccessLinks();
    renderSharedNavigation(user);
    setupMobileNavigation();
    setupLibraryTabs();
    setupEmptyCollectionPage();
    setupSearchPage();
    const profileButton = document.querySelector('.btn-upgrade');
    if (profileButton) {
        profileButton.textContent = user ? user.username : 'Se connecter';
        profileButton.href = user ? 'profile.html' : 'index.html?auth=login';
    }
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    if (user && profileName && profileEmail) {
        profileName.textContent = user.username;
        profileEmail.textContent = user.email;
    }
    setupProfilePage(user);
    setupLibraryPage(user);

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('soundwave_user');
            window.location.href = 'index.html';
        });
    }
});