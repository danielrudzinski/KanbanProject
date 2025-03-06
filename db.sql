CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE columns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    wip_limit INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    column_id INTEGER NOT NULL,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

--
-- Inserts just for starters, we will delete them later when needed (all users will have different tables etc.)
--

-- Wrap inserts in a transaction block
BEGIN;

-- Insert columns first since tasks depend on them
DO $$ 
BEGIN
    INSERT INTO columns (name) VALUES ('Requested');
    INSERT INTO columns (name, wip_limit) VALUES ('In Progress', 5);
    INSERT INTO columns (name) VALUES ('Done');
    INSERT INTO columns (name) VALUES ('Expedite');

    INSERT INTO users (email, password, name) VALUES ('user1@example.com', 'password1', 'User One');
    INSERT INTO users (email, password, name) VALUES ('user2@example.com', 'password2', 'User Two');
END $$;

COMMIT;