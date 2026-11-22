-- Make PENDING the database default for new community links
ALTER TABLE "CommunityLink"
ALTER COLUMN "status"
SET DEFAULT 'PENDING';