CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio VARCHAR(280),
    description VARCHAR(280),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
