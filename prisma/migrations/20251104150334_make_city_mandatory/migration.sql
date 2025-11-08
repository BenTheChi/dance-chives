-- Step 1: Ensure all users have a city (assign default city to users without one)
-- Using New York (cityId: "1") as default
-- Note: City is required at the application level. This migration ensures existing users have cities.
INSERT INTO "City" ("id", "cityId", "userId")
SELECT 
  gen_random_uuid()::text as id,
  '1' as "cityId",
  u.id as "userId"
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "City" c WHERE c."userId" = u.id
);

-- Note: Prisma does not support making relation fields required when the foreign key
-- is on the related table. The city requirement is enforced at the application level
-- through validation during user creation and seed data.
