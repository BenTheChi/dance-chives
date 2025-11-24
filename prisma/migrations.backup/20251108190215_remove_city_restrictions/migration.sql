-- Drop foreign key constraints first
ALTER TABLE "City" DROP CONSTRAINT IF EXISTS "City_userId_fkey";
ALTER TABLE "GlobalAccessRequest" DROP CONSTRAINT IF EXISTS "GlobalAccessRequest_senderId_fkey";

-- Drop unique constraint (this also drops the associated index)
ALTER TABLE "City" DROP CONSTRAINT IF EXISTS "City_userId_key";

-- Drop indexes
DROP INDEX IF EXISTS "City_cityId_idx";
DROP INDEX IF EXISTS "GlobalAccessRequest_senderId_idx";
DROP INDEX IF EXISTS "GlobalAccessRequest_status_idx";

-- Drop tables
DROP TABLE IF EXISTS "City";
DROP TABLE IF EXISTS "GlobalAccessRequest";

-- Drop column from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "allCityAccess";

