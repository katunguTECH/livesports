-- CreateTable
CREATE TABLE "Broadcaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "affiliateUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Broadcaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueBroadcasterMapping" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "leagueName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "directUrl" TEXT,
    "broadcasterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueBroadcasterMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueBroadcasterMapping_countryCode_idx" ON "LeagueBroadcasterMapping"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueBroadcasterMapping_leagueId_countryCode_key" ON "LeagueBroadcasterMapping"("leagueId", "countryCode");

-- AddForeignKey
ALTER TABLE "LeagueBroadcasterMapping" ADD CONSTRAINT "LeagueBroadcasterMapping_broadcasterId_fkey" FOREIGN KEY ("broadcasterId") REFERENCES "Broadcaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
