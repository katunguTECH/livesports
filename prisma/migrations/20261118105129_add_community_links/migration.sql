-- CreateEnum
CREATE TYPE "CommunityLinkStatus" AS ENUM ('PUBLISHED', 'REMOVED');

-- CreateTable
CREATE TABLE "CommunityLink" (
    "id" SERIAL NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "leagueName" TEXT NOT NULL,
    "homeName" TEXT NOT NULL,
    "awayName" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "submittedByUserId" TEXT,
    "status" "CommunityLinkStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityLinkReport" (
    "id" SERIAL NOT NULL,
    "linkId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityLinkReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityLink_fixtureId_status_createdAt_idx" ON "CommunityLink"("fixtureId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityLink_fixtureId_url_key" ON "CommunityLink"("fixtureId", "url");

-- CreateIndex
CREATE INDEX "CommunityLinkReport_linkId_createdAt_idx" ON "CommunityLinkReport"("linkId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityLinkReport" ADD CONSTRAINT "CommunityLinkReport_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "CommunityLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
