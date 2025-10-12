-- Test data for dance-chives development
-- This script runs after Prisma migrations

-- Insert test users
INSERT INTO "User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", auth) VALUES
('test-user-1', 'Alice Johnson', 'alice@example.com', NOW(), 'https://example.com/alice.jpg', NOW(), NOW(), 3),
('test-user-2', 'Bob Smith', 'bob@example.com', NOW(), 'https://example.com/bob.jpg', NOW(), NOW(), 2),
('test-user-3', 'Carol Davis', 'carol@example.com', NOW(), 'https://example.com/carol.jpg', NOW(), NOW(), 1),
('test-user-4', 'David Wilson', 'david@example.com', NOW(), 'https://example.com/david.jpg', NOW(), NOW(), 1),
('test-user-5', 'Eva Martinez', 'eva@example.com', NOW(), 'https://example.com/eva.jpg', NOW(), NOW(), 0)
ON CONFLICT (email) DO NOTHING;

-- Insert test events (user-event relationships)
INSERT INTO "Event" (id, "eventId", "userId", creator) VALUES
('event-rel-1', 'summer-battle-2024', 'test-user-1', true),
('event-rel-2', 'summer-battle-2024', 'test-user-2', false),
('event-rel-3', 'winter-cypher-2024', 'test-user-2', true),
('event-rel-4', 'winter-cypher-2024', 'test-user-3', false),
('event-rel-5', 'spring-jam-2024', 'test-user-1', true),
('event-rel-6', 'spring-jam-2024', 'test-user-4', false)
ON CONFLICT (id) DO NOTHING;

-- Insert test cities (user-city relationships)
INSERT INTO "City" (id, "cityId", "userId") VALUES
('city-rel-1', 'new-york-ny', 'test-user-1'),
('city-rel-2', 'los-angeles-ca', 'test-user-2'),
('city-rel-3', 'chicago-il', 'test-user-3'),
('city-rel-4', 'new-york-ny', 'test-user-4'),
('city-rel-5', 'miami-fl', 'test-user-5')
ON CONFLICT (id) DO NOTHING;

-- Insert test auth codes
INSERT INTO "AuthCodes" (id, code, level, uses, expires) VALUES
('auth-code-1', 'ADMIN2024', 3, 5, NOW() + INTERVAL '30 days'),
('auth-code-2', 'MODERATOR2024', 2, 10, NOW() + INTERVAL '30 days'),
('auth-code-3', 'CREATOR2024', 1, 20, NOW() + INTERVAL '30 days'),
('auth-code-4', 'EXPIRED2023', 1, 0, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert test accounts (OAuth accounts)
INSERT INTO "Account" ("userId", type, provider, "providerAccountId", "access_token", "refresh_token", "expires_at", "token_type", scope, "id_token", "session_state", "createdAt", "updatedAt") VALUES
('test-user-1', 'oauth', 'google', 'google-123456', 'test-access-token-1', 'test-refresh-token-1', EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour')::INTEGER, 'Bearer', 'openid email profile', 'test-id-token-1', 'test-session-state-1', NOW(), NOW()),
('test-user-2', 'oauth', 'google', 'google-789012', 'test-access-token-2', 'test-refresh-token-2', EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour')::INTEGER, 'Bearer', 'openid email profile', 'test-id-token-2', 'test-session-state-2', NOW(), NOW())
ON CONFLICT (provider, "providerAccountId") DO NOTHING;
