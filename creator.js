const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('ngrok-skip-browser-warning', 'true');
    return nativeFetch(input, { ...options, headers });
};

const API_URL = '/api';

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('soundwave_user') || 'null');
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function addAudioFileInput(form) {
    if (document.getElementById('track-audio-file')) return;
    const audioUrl = document.getElementById('track-audio');
    if (!audioUrl) return;
    const field = document.createElement('div');
    field.className = 'form-field form-wide';
    field.innerHTML = '<label for="track-audio-file">Fichier MP3</label><input id="track-audio-file" name="audioFile" type="file" accept="audio/mpeg,.mp3"><small>MP3 uniquement, 50 Mo maximum. Une URL MP3 reste possible ci-dessous.</small>';
    audioUrl.closest('.form-field').before(field);
    const durationField = document.getElementById('track-duration');
    if (durationField) durationField.closest('.form-field').hidden = true;
    document.getElementById('track-audio-file').addEventListener('change', async event => {
        const file = event.target.files[0];
        if (!file) return;
        const preview = document.createElement('audio');
        preview.preload = 'metadata';
        preview.src = URL.createObjectURL(file);
        preview.addEventListener('loadedmetadata', () => {
            if (durationField) durationField.value = Math.round(preview.duration);
            URL.revokeObjectURL(preview.src);
        }, { once: true });
    });
}

function renderCatalog(tracks) {
    const catalog = document.getElementById('creator-catalog');
    const count = document.getElementById('track-count');
    const status = document.getElementById('catalog-status');
    count.textContent = tracks.length;
    status.textContent = `${tracks.length} titre${tracks.length > 1 ? 's' : ''}`;
    if (!tracks.length) {
        catalog.innerHTML = '<div class="creator-empty"><i class="fas fa-music"></i><strong>Aucune publication</strong><span>Votre premier titre apparaîtra ici.</span></div>';
        return;
    }
    catalog.innerHTML = tracks.map(track => `<article class="creator-track"><img src="${escapeHtml(track.cover_url || 'https://via.placeholder.com/58/252525/ffffff?text=SW')}" alt="${escapeHtml(track.title)}"><span class="creator-track-info"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}${track.album ? ` · ${escapeHtml(track.album)}` : ''}</small></span><span class="creator-track-meta">${escapeHtml(track.genre || 'Genre non renseigné')} · ${escapeHtml(track.style || 'Style non renseigné')}</span><button class="creator-delete" data-id="${track.id}" title="Supprimer"><i class="fas fa-trash"></i></button></article>`).join('');
    catalog.querySelectorAll('.creator-delete').forEach(button => button.addEventListener('click', async () => {
        if (!window.confirm('Supprimer cette publication ?')) return;
        await fetch(`${API_URL}/tracks/${button.dataset.id}`, { method: 'DELETE' });
        loadCatalog();
    }));
}

async function loadCatalog() {
    const user = getCurrentUser();
    const response = await fetch(`${API_URL}/tracks?creatorId=${encodeURIComponent(user.id)}`);
    renderCatalog(await response.json());
}

function showCreatorSignup(user) {
    document.querySelector('.creator-main').innerHTML = `
        <section class="creator-onboarding">
            <span class="eyebrow">SoundWave Creator</span>
            <h1>Créez votre espace de publication.</h1>
            <p>Votre compte SoundWave vous permet d’écouter. Un compte Creator séparé vous permet de publier et gérer vos créations.</p>
            <form id="creator-signup-form" class="creator-signup-form">
                <label for="creator-display-name">Nom affiché par le créateur</label>
                <input id="creator-display-name" required maxlength="100" placeholder="Ex. Studio Nova">
                <button class="creator-button" type="submit"><i class="fas fa-arrow-right"></i> Créer mon compte Creator</button>
                <p id="creator-signup-message" class="creator-message" aria-live="polite"></p>
            </form>
        </section>
    `;
    document.getElementById('creator-signup-form').addEventListener('submit', async event => {
        event.preventDefault();
        const message = document.getElementById('creator-signup-message');
        const displayName = document.getElementById('creator-display-name').value;
        try {
            const response = await fetch(`${API_URL}/creators`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, displayName })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Création impossible.');
            window.location.reload();
        } catch (error) {
            message.textContent = error.message;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        document.querySelector('.creator-main').innerHTML = '<div class="creator-locked"><i class="fas fa-lock"></i><h1>Connectez-vous pour accéder à Creator</h1><p>Votre espace de publication est réservé aux utilisateurs SoundWave.</p><a href="index.html">Retour à SoundWave</a></div>';
        return;
    }
    if (user) document.getElementById('creator-username').textContent = user.username;
    const form = document.getElementById('track-form');
    addAudioFileInput(form);
    const message = document.getElementById('creator-message');
    fetch(`${API_URL}/creators/${user.id}`).then(response => response.json()).then(creator => {
        if (!creator) showCreatorSignup(user);
    }).catch(() => showCreatorSignup(user));

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        message.textContent = 'Publication en cours...';
        const values = Object.fromEntries(new FormData(form).entries());
        try {
            const formData = new FormData(form);
            formData.append('creatorId', user.id);
            formData.append('isFeatured', document.getElementById('track-featured').checked);
            const response = await fetch(`${API_URL}/tracks`, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Publication impossible.');
            form.reset();
            message.textContent = 'Titre publié avec succès.';
            loadCatalog();
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
    loadCatalog().catch(() => { document.getElementById('creator-message').textContent = 'Serveur indisponible.'; });
});