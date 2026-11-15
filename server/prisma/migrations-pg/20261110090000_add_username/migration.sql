-- Add username column and make email optional. Preserves existing rows
-- by backfilling username from each user's email local-part. If two rows
-- share the same local-part (rare in seed data), suffix with the first
-- 6 chars of the user id to keep the new unique constraint satisfied.

-- 1. Add username column as NULLable initially so existing rows survive.
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- 2. Backfill username from email local-part for every existing row.
UPDATE "users"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL;

-- 3. Resolve any collisions (same local-part) by appending part of the id.
UPDATE "users" u
SET "username" = u."username" || '_' || substr(u."id", 1, 6)
WHERE u."id" IN (
  SELECT dup."id"
  FROM "users" dup
  JOIN (
    SELECT "username" FROM "users" GROUP BY "username" HAVING count(*) > 1
  ) grouped ON grouped."username" = dup."username"
  WHERE dup."id" NOT IN (
    SELECT min("id") FROM "users" GROUP BY "username"
  )
);

-- 4. Enforce NOT NULL + unique on username.
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_username_idx" ON "users"("username");

-- 5. Email becomes optional; unique constraint stays but now permits multiple NULLs.
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
