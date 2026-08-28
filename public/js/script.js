const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('ngrok-skip-browser-warning', 'true');
    return nativeFetch(input, { ...options, headers });
};

function createCard(track) {
    const trackId = track.id;
    const cover = track.cover_url || 'https://via.placeholder.com/200/1b1b1b/ffffff?text=Sonovia';
    return `
        <div class="card" onclick="playTrack('${track.title}', '${track.artist}', '${cover}', '${encodeURIComponent(track.audio_url || '')}', '${trackId}')">
            <img src="${cover}" alt="${track.title}">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <h4>${track.title}</h4>
            <p>${track.artist}${track.album ? ` · ${track.album}` : ''}</p>
            <button class="like-button${track.liked_by_user ? ' liked' : ''}" data-track-id="${trackId}" aria-label="${track.liked_by_user ? 'Retirer le like' : 'Aimer ce morceau'}"><i class="fa${track.liked_by_user ? 's' : 'r'} fa-heart"></i></button>
            <button class="library-add" data-track-id="${trackId}" data-title="${track.title}" data-artist="${track.artist}" data-album="${track.album || ''}" data-genre="${track.genre || ''}" data-style="${track.style || ''}" data-duration="${track.duration_seconds || ''}" data-cover="${cover}" title="Ajouter à la bibliothèque"><i class="fas fa-plus"></i></button>
        </div>
    `;
}

function renderMusic() {
    const recentContainer = document.getElementById('recent-music');
    const recommendedContainer = document.getElementById('recommended-music');

    if (!recentContainer || !recommendedContainer) return;
    const user = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
    fetch(`${API_URL}/tracks${user ? `?userId=${encodeURIComponent(user.id)}` : ''}`)
        .then(response => {
            if (!response.ok) throw new Error('catalogue indisponible');
            return response.json();
        })
        .then(tracks => {
            const featured = tracks.filter(track => track.is_featured);
            recentContainer.innerHTML = tracks.length ? tracks.slice(0, 5).map(createCard).join('') : emptyTrackState();
            recommendedContainer.innerHTML = featured.length ? featured.map(createCard).join('') : emptyTrackState();
            document.querySelectorAll('.library-add').forEach(button => button.addEventListener('click', addToLibrary));
            document.querySelectorAll('.like-button').forEach(button => button.addEventListener('click', event => {
                event.stopPropagation();
                toggleLike(button.dataset.trackId, button);
            }));
        })
        .catch(() => {
            recentContainer.innerHTML = emptyTrackState('Catalogue indisponible');
            recommendedContainer.innerHTML = emptyTrackState('Catalogue indisponible');
        });
}

function emptyTrackState(title = 'Aucune musique disponible') {
    return `<div class="empty-library"><i class="fas fa-music"></i><strong>${title}</strong><span>Les morceaux ajoutés au catalogue apparaîtront ici.</span></div>`;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

let playerVolume = 0.7;

function getAudioElement() {
    let audio = document.getElementById('soundwave-audio');
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'soundwave-audio';
        audio.preload = 'metadata';
        audio.volume = playerVolume;
        document.body.appendChild(audio);
        audio.addEventListener('loadedmetadata', () => updatePlayerTime(audio));
        audio.addEventListener('timeupdate', () => updatePlayerTime(audio));
        audio.addEventListener('ended', () => {
            updatePlayerTime(audio);
            const masterPlay = document.getElementById('master-play');
            if (masterPlay) {
                masterPlay.classList.remove('fa-pause-circle');
                masterPlay.classList.add('fa-play-circle');
            }
        });
    }
    return audio;
}

function syncVolumeUI() {
    const audio = getAudioElement();
    const volumeButton = document.getElementById('volume-button');
    const volumeProgress = document.querySelector('.volume-progress');
    const nextVolume = Math.min(Math.max(playerVolume, 0), 1);

    if (audio) {
        audio.volume = nextVolume;
        audio.muted = nextVolume === 0;
    }
    if (volumeButton) {
        volumeButton.classList.toggle('fa-volume-up', nextVolume > 0);
        volumeButton.classList.toggle('fa-volume-mute', nextVolume === 0);
    }
    if (volumeProgress) {
        volumeProgress.style.width = `${nextVolume * 100}%`;
    }
}

function updatePlayerTime(audio) {
    const elapsed = document.getElementById('current-time');
    const duration = document.getElementById('track-duration-display');
    const progress = document.querySelector('.progress');
    if (elapsed) elapsed.textContent = formatTime(audio.currentTime);
    if (duration) duration.textContent = formatTime(audio.duration);
    if (progress) progress.style.width = audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : '0%';
}

function setupProgressSeek() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;
    progressBar.addEventListener('click', event => {
        const audio = document.getElementById('soundwave-audio');
        if (!audio || !Number.isFinite(audio.duration)) return;
        const bounds = progressBar.getBoundingClientRect();
        const position = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
        audio.currentTime = (position / bounds.width) * audio.duration;
        updatePlayerTime(audio);
    });
}

function showPlayerNotice(message) {
    let notice = document.getElementById('player-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'player-notice';
        document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.classList.add('visible');
    clearTimeout(showPlayerNotice.timeout);
    showPlayerNotice.timeout = setTimeout(() => notice.classList.remove('visible'), 2200);
}

function setupPlayerActions() {
    const volumeButton = document.getElementById('volume-button');
    const volumeBar = document.getElementById('volume-bar');
    const queueButton = document.getElementById('queue-button');
    const deviceButton = document.getElementById('device-button');
    syncVolumeUI();
    if (volumeButton && volumeBar) {
        volumeButton.addEventListener('click', () => {
            playerVolume = playerVolume > 0 ? 0 : 0.7;
            syncVolumeUI();
        });
        const setVolumeFromPointer = event => {
            const bounds = volumeBar.getBoundingClientRect();
            playerVolume = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
            syncVolumeUI();
        };
        volumeBar.addEventListener('pointerdown', event => {
            event.preventDefault();
            volumeBar.setPointerCapture(event.pointerId);
            setVolumeFromPointer(event);
        });
        volumeBar.addEventListener('pointermove', event => {
            if (volumeBar.hasPointerCapture(event.pointerId)) setVolumeFromPointer(event);
        });
    }
    queueButton?.addEventListener('click', () => showPlayerNotice('La file d’attente sera disponible prochainement.'));
    deviceButton?.addEventListener('click', () => showPlayerNotice('Lecture sur cet appareil.'));
}

async function addToLibrary(event) {
    event.stopPropagation();
    const user = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
    if (!user) {
        alert('Connectez-vous pour créer votre bibliothèque.');
        return;
    }

    const button = event.currentTarget;
    const response = await fetch(`${API_URL}/users/${user.id}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            trackId: button.dataset.trackId,
            title: button.dataset.title,
            artist: button.dataset.artist,
            album: button.dataset.album,
            genre: button.dataset.genre,
            style: button.dataset.style,
            durationSeconds: button.dataset.duration,
            coverUrl: button.dataset.cover
        })
    });
    button.innerHTML = response.ok ? '<i class="fas fa-check"></i>' : '<i class="fas fa-check"></i>';
    button.disabled = true;
}

async function toggleLike(trackId, button) {
    const user = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
    if (!user) {
        alert('Connectez-vous pour aimer un morceau.');
        return;
    }
    const liked = button.classList.contains('liked');
    const response = await fetch(`${API_URL}/tracks/${trackId}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
    });
    if (!response.ok) return;
    button.classList.toggle('liked', !liked);
    button.innerHTML = `<i class="fa${liked ? 'r' : 's'} fa-heart"></i>`;
    button.setAttribute('aria-label', liked ? 'Aimer ce morceau' : 'Retirer le like');
    const playerLike = document.querySelector('.now-playing .like-button');
    if (playerLike && playerLike.dataset.trackId === String(trackId)) {
        playerLike.classList.toggle('liked', !liked);
        playerLike.innerHTML = button.innerHTML;
    }
}

function playTrack(title, artist, cover, encodedAudioUrl = '', trackId = '') {
    document.getElementById('current-track-title').innerText = title;
    document.getElementById('current-track-artist').innerText = artist;
    document.getElementById('current-album-art').src = cover;
    const playerLike = document.querySelector('.now-playing .fa-heart');
    if (playerLike) {
        const cardLike = document.querySelector(`.like-button[data-track-id="${trackId}"]`);
        const isLiked = cardLike?.classList.contains('liked');
        playerLike.className = `${isLiked ? 'fas' : 'far'} fa-heart like-button${isLiked ? ' liked' : ''}`;
        playerLike.dataset.trackId = trackId;
        playerLike.onclick = event => {
            event.stopPropagation();
            toggleLike(trackId, playerLike);
        };
    }

    const audioUrl = decodeURIComponent(encodedAudioUrl);
    const audio = getAudioElement();
    audio.volume = playerVolume;
    if (audioUrl) {
        audio.src = audioUrl;
        audio.play().catch(() => {});
    }

    const playBtn = document.getElementById('master-play');
    if (audioUrl && playBtn) {
        playBtn.classList.remove('fa-play-circle');
        playBtn.classList.add('fa-pause-circle');
    }
}

// Toggle play/pause
const masterPlay = document.getElementById('master-play');
if (masterPlay) {
    masterPlay.addEventListener('click', function() {
        const audio = document.getElementById('soundwave-audio');
        if (audio && audio.src) {
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        }
        if (audio && audio.src) {
            this.classList.toggle('fa-play-circle', audio.paused);
            this.classList.toggle('fa-pause-circle', !audio.paused);
        }
    });
}

const API_URL = '/api';

// --- Auth Logic ---

function openAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Handle Signup
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
                switchAuthTab('login');
            } else {
                alert(data.error || 'Une erreur est survenue.');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur.');
        }
    });
}

// Handle Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                alert(`Bienvenue, ${data.username} !`);
                closeAuthModal();
                localStorage.setItem('soundwave_user', JSON.stringify(data));
                updateUIForUser(data);
                window.location.href = 'landing.html';
            } else {
                alert(data.error || 'Identifiants incorrects.');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur.');
        }
    });
}

function updateUIForUser(user) {
    // Change "Se connecter" in header to "Profil"
    const authBtn = document.querySelector('.btn-upgrade');
    if (authBtn) {
        authBtn.innerText = user.username;
        authBtn.classList.add('profile-button');
        authBtn.onclick = () => {
            window.location.href = 'profile.html';
        };
    }
    
    // Replace visitor links with authenticated-user navigation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.innerHTML = `
            <li class="active"><a href="landing.html"><i class="fas fa-home"></i> Accueil</a></li>
            <li><a href="search.html"><i class="fas fa-search"></i> Rechercher</a></li>
            <li><a href="library.html"><i class="fas fa-book-open"></i> Bibliothèque</a></li>
            <li><a href="premium.html"><i class="fas fa-crown"></i> Premium</a></li>
            <li><a href="profile.html"><i class="fas fa-user"></i> Mon profil</a></li>
        `;
    }

    const accountSection = document.querySelector('.playlists');
    if (accountSection) {
        accountSection.innerHTML = `
            <h3>Votre compte</h3>
            <ul class="playlist-links">
                <li><a href="profile.html">Profil</a></li>
                <li><a href="abonnement.html">Abonnement</a></li>
            </ul>
        `;
    }
}

function updateUIForVisitor() {
    const playlists = document.querySelector('.playlists');
    if (playlists) playlists.hidden = true;
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
}

// Event Listeners
const upgradeButton = document.querySelector('.btn-upgrade');
if (upgradeButton) {
    upgradeButton.addEventListener('click', (event) => {
        if (!event.currentTarget.classList.contains('profile-button')) {
            openAuthModal();
        }
    });
}

const closeModalButton = document.querySelector('.close-modal');
if (closeModalButton) {
    closeModalButton.addEventListener('click', closeAuthModal);
}

document.querySelectorAll('.auth-trigger').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        openAuthModal();
        switchAuthTab(link.textContent.includes('Inscrire') ? 'signup' : 'login');
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('auth-modal');
    if (e.target === modal) closeAuthModal();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = new Set(['landing.html', 'library.html', 'profile.html', 'abonnement.html', 'creator.html']);
    const savedUser = JSON.parse(localStorage.getItem('soundwave_user'));

    if (!savedUser && protectedPages.has(currentPage)) {
        window.location.replace('index.html?auth=login');
        return;
    }

    if (!document.querySelector('.page-quick-access-list')) {
        const quickAccess = document.createElement('div');
        quickAccess.className = 'page-quick-access-list';
        const remunerationHref = savedUser ? 'remuneration.html' : 'remuneration-public.html';
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

    renderMusic();
    setupProgressSeek();
    setupPlayerActions();
    document.body.classList.toggle('visitor-mode', !savedUser);
    if (savedUser) {
        updateUIForUser(savedUser);
    } else {
        updateUIForVisitor();
    }
    setupMobileNavigation();

    const requestedAuthTab = new URLSearchParams(window.location.search).get('auth');
    if (!savedUser && (requestedAuthTab === 'login' || requestedAuthTab === 'signup')) {
        switchAuthTab(requestedAuthTab);
        openAuthModal();
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});