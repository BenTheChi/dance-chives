-- Ensure anon user exists for anonymous video reactions (React.userId FK).
-- Idempotent: insert only if not exists.
INSERT INTO "User" (id, email, "createdAt", "updatedAt")
VALUES ('anon', 'anon@dancechives.local', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
