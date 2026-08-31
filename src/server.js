const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('./db_config');
require('dotenv').config();

const app = express();
const publicDirectory = path.join(process.cwd(), 'public');
const uploadsDirectory = path.join(publicDirectory, 'uploads');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

fs.mkdirSync(publicDirectory, { recursive: true });
fs.mkdirSync(uploadsDirectory, { recursive: true });

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(publicDirectory));
app.use('/uploads', express.static(uploadsDirectory));

const uploadMp3 = multer({
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const isMp3 = file.mimetype === 'audio/mpeg' || path.extname(file.originalname).toLowerCase() === '.mp3';
        callback(isMp3 ? null : new Error('Seuls les fichiers MP3 sont acceptés.'), isMp3);
    }
});

const PORT = process.env.PORT || 3000;

// --- Database Initialization ---
async function initDb() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await db.query(`
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS avatar_url TEXT,
                ADD COLUMN IF NOT EXISTS bio VARCHAR(280),
                ADD COLUMN IF NOT EXISTS description VARCHAR(280);

            UPDATE users SET description = bio
            WHERE description IS NULL AND bio IS NOT NULL;

            CREATE TABLE IF NOT EXISTS user_follows (
                follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (follower_id, following_id),
                CHECK (follower_id <> following_id)
            );

            CREATE TABLE IF NOT EXISTS user_library (
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                track_id VARCHAR(120) NOT NULL,
                title VARCHAR(160) NOT NULL,
                artist VARCHAR(160) NOT NULL,
                album VARCHAR(160),
                genre VARCHAR(80),
                style VARCHAR(80),
                cover_url TEXT,
                duration VARCHAR(10),
                added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, track_id)
            );
            ALTER TABLE user_library
                ADD COLUMN IF NOT EXISTS album VARCHAR(160),
                ADD COLUMN IF NOT EXISTS genre VARCHAR(80),
                ADD COLUMN IF NOT EXISTS style VARCHAR(80);

            CREATE TABLE IF NOT EXISTS tracks (
                id BIGSERIAL PRIMARY KEY,
                creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
                title VARCHAR(160) NOT NULL,
                artist VARCHAR(160) NOT NULL,
                album VARCHAR(160),
                genre VARCHAR(80),
                style VARCHAR(80),
                duration_seconds INTEGER,
                cover_url TEXT,
                audio_url TEXT,
                release_date DATE,
                is_featured BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            ALTER TABLE tracks
                ADD COLUMN IF NOT EXISTS creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

            CREATE TABLE IF NOT EXISTS track_likes (
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                track_id BIGINT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, track_id)
            );

            CREATE TABLE IF NOT EXISTS creator_accounts (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                display_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}
initDb();

// --- Auth Endpoints ---

// Registration
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url, description',
            [username, email, passwordHash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Ce pseudo ou cet email est déjà utilisé.' });
        } else {
            res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
        }
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query(
            'SELECT id, username, email, password_hash, avatar_url, description FROM users WHERE email = $1',
            [email]
        );
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password_hash)) {
            const { password_hash: _, ...safeUser } = user;
            res.json(safeUser);
        } else {
            res.status(401).json({ error: 'Identifiants incorrects.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;

// Profile
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.username, u.email, u.avatar_url, u.description,
                (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) AS following_count
            FROM users u WHERE u.id = $1
        `, [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { username, email, description, avatarUrl } = req.body;
    if (!username || !email) return res.status(400).json({ error: 'Le pseudo et l’email sont obligatoires.' });
    try {
        const result = await db.query(`
            UPDATE users SET username = $1, email = $2, description = $3, avatar_url = $4
            WHERE id = $5
            RETURNING id, username, email, avatar_url, description
        `, [username.trim(), email.trim().toLowerCase(), description?.trim() || null, avatarUrl?.trim() || null, req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Ce pseudo ou cet email est déjà utilisé.' });
        res.status(500).json({ error: 'Impossible de mettre à jour le profil.' });
    }
});

app.post('/api/users/:id/follow', async (req, res) => {
    const { followerId } = req.body;
    try {
        await db.query('INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)', [followerId, req.params.id]);
        res.status(201).json({ following: true });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Vous suivez déjà cet utilisateur.' });
        if (err.code === '23514') return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même.' });
        res.status(500).json({ error: 'Impossible de suivre cet utilisateur.' });
    }
});

app.delete('/api/users/:id/follow', async (req, res) => {
    await db.query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [req.body.followerId, req.params.id]);
    res.json({ following: false });
});

app.get('/api/users', async (req, res) => {
    const search = `%${(req.query.search || '').trim()}%`;
    try {
        const result = await db.query(`
            SELECT id, username, avatar_url, bio,
                (SELECT COUNT(*) FROM user_follows WHERE following_id = users.id) AS followers_count
            FROM users
            WHERE username ILIKE $1
            ORDER BY username
            LIMIT 20
        `, [search]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Impossible de rechercher des utilisateurs.' });
    }
});

// Personal library
app.get('/api/users/:id/library', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT track_id, title, artist, album, genre, style, cover_url, duration, added_at
            FROM user_library WHERE user_id = $1 ORDER BY added_at DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Impossible de charger votre bibliothèque.' });
    }
});

app.post('/api/users/:id/library', async (req, res) => {
    const { trackId, title, artist, album, genre, style, coverUrl, duration } = req.body;
    if (!trackId || !title || !artist) return res.status(400).json({ error: 'Les informations du titre sont incomplètes.' });
    try {
        const result = await db.query(`
            INSERT INTO user_library (user_id, track_id, title, artist, album, genre, style, cover_url, duration)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING track_id, title, artist, album, genre, style, cover_url, duration, added_at
        `, [req.params.id, trackId, title, artist, album || null, genre || null, style || null, coverUrl || null, duration || null]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Ce titre est déjà dans votre bibliothèque.' });
        res.status(500).json({ error: 'Impossible d’ajouter ce titre.' });
    }
});

app.delete('/api/users/:id/library/:trackId', async (req, res) => {
    try {
        await db.query('DELETE FROM user_library WHERE user_id = $1 AND track_id = $2', [req.params.id, req.params.trackId]);
        res.json({ removed: true });
    } catch (err) {
        res.status(500).json({ error: 'Impossible de retirer ce titre.' });
    }
});

// Public music catalog
app.get('/api/tracks', async (req, res) => {
    const search = `%${(req.query.search || '').trim()}%`;
    const creatorId = req.query.creatorId || null;
    const userId = req.query.userId || null;
    try {
        const result = await db.query(`
            SELECT id, title, artist, album, genre, style, duration_seconds,
                cover_url, audio_url, release_date, is_featured,
                CASE WHEN $3::bigint IS NULL THEN FALSE
                    ELSE EXISTS (SELECT 1 FROM track_likes WHERE track_id = tracks.id AND user_id = $3)
                END AS liked_by_user
            FROM tracks
            WHERE ($2::bigint IS NULL OR creator_id = $2)
                AND ($1 = '%%' OR title ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1
                OR genre ILIKE $1 OR style ILIKE $1)
            ORDER BY created_at DESC
        `, [search, creatorId, userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Impossible de charger le catalogue musical.' });
    }
});

app.post('/api/tracks', (req, res, next) => {
    uploadMp3.single('audioFile')(req, res, error => {
        if (error) return res.status(400).json({ error: error.message });
        next();
    });
}, async (req, res) => {
    const { creatorId, title, artist, album, genre, style, durationSeconds, coverUrl, audioUrl, releaseDate, isFeatured } = req.body || {};
    if (!title || !artist) return res.status(400).json({ error: 'Le titre et l’artiste sont obligatoires.' });
    const storedAudioUrl = req.file ? `/uploads/${req.file.filename}` : audioUrl?.trim() || null;
    try {
        const creator = await db.query('SELECT id FROM creator_accounts WHERE user_id = $1', [creatorId]);
        if (!creator.rows[0]) return res.status(403).json({ error: 'Créez d’abord un compte créateur.' });
        const result = await db.query(`
            INSERT INTO tracks (creator_id, title, artist, album, genre, style, duration_seconds, cover_url, audio_url, release_date, is_featured)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [creatorId || null, title.trim(), artist.trim(), album?.trim() || null, genre?.trim() || null, style?.trim() || null, durationSeconds || null, coverUrl?.trim() || null, storedAudioUrl, releaseDate || null, Boolean(isFeatured)]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Impossible d’ajouter ce morceau.' });
    }
});

app.delete('/api/tracks/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: 'Impossible de supprimer ce morceau.' });
    }
});

// Creator accounts
app.get('/api/creators/:userId', async (req, res) => {
    try {
        const result = await db.query('SELECT id, user_id, display_name, created_at FROM creator_accounts WHERE user_id = $1', [req.params.userId]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Impossible de vérifier le compte créateur.' });
    }
});

app.post('/api/creators', async (req, res) => {
    const { userId, displayName } = req.body;
    if (!userId || !displayName?.trim()) return res.status(400).json({ error: 'Le nom créateur est obligatoire.' });
    try {
        const result = await db.query(`
            INSERT INTO creator_accounts (user_id, display_name) VALUES ($1, $2)
            RETURNING id, user_id, display_name, created_at
        `, [userId, displayName.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Un compte créateur existe déjà pour cet utilisateur.' });
        res.status(500).json({ error: 'Impossible de créer le compte créateur.' });
    }
});

app.post('/api/tracks/:id/like', async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Connectez-vous pour aimer un morceau.' });
    try {
        await db.query('INSERT INTO track_likes (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, req.params.id]);
        res.json({ liked: true });
    } catch (err) {
        res.status(500).json({ error: 'Impossible d’aimer ce morceau.' });
    }
});

app.delete('/api/tracks/:id/like', async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Connectez-vous pour modifier vos likes.' });
    try {
        await db.query('DELETE FROM track_likes WHERE user_id = $1 AND track_id = $2', [userId, req.params.id]);
        res.json({ liked: false });
    } catch (err) {
        res.status(500).json({ error: 'Impossible de retirer ce like.' });
    }
});