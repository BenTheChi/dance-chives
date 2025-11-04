-- Step 1: Delete duplicate city records, keeping only the first one per user (by id)
WITH ranked_cities AS (
  SELECT id, "userId", "cityId",
         ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY id ASC) as rn
  FROM "City"
)
DELETE FROM "City"
WHERE id IN (
  SELECT id FROM ranked_cities WHERE rn > 1
);

-- Step 2: Add unique constraint to userId
ALTER TABLE "City" ADD CONSTRAINT "City_userId_key" UNIQUE ("userId");
