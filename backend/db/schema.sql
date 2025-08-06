CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS teams (
                                     id SERIAL PRIMARY KEY,
                                     user_id INTEGER REFERENCES users(id),
    name VARCHAR(255),
    pokemon_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS session (
                                       sid VARCHAR NOT NULL PRIMARY KEY,
                                       sess JSON NOT NULL,
                                       expire TIMESTAMP(6) NOT NULL
    );
