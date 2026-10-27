-- Add sport column as nullable first (safe for existing rows)
ALTER TABLE "LeagueBroadcasterMapping" ADD COLUMN "sport" TEXT;

-- Backfill existing rows as football
UPDATE "LeagueBroadcasterMapping" SET "sport" = 'football' WHERE "sport" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "LeagueBroadcasterMapping" ALTER COLUMN "sport" SET NOT NULL;

-- Drop old indexes
DROP INDEX "LeagueBroadcasterMapping_countryCode_idx";
DROP INDEX "LeagueBroadcasterMapping_leagueId_countryCode_key";

-- Create new composite unique index (sport + leagueId + countryCode)
CREATE UNIQUE INDEX "LeagueBroadcasterMapping_sport_leagueId_countryCode_key" ON "LeagueBroadcasterMapping"("sport", "leagueId", "countryCode");

-- Create new performance index (sport + countryCode)
CREATE INDEX "LeagueBroadcasterMapping_sport_countryCode_idx" ON "LeagueBroadcasterMapping"("sport", "countryCode");