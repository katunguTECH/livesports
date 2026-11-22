-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "userAgent" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkClick" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "fixtureId" TEXT,
    "linkUrl" TEXT NOT NULL,
    "linkTitle" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt");

-- CreateIndex
CREATE INDEX "SiteVisit_country_idx" ON "SiteVisit"("country");

-- CreateIndex
CREATE INDEX "SiteVisit_ip_idx" ON "SiteVisit"("ip");

-- CreateIndex
CREATE INDEX "LinkClick_createdAt_idx" ON "LinkClick"("createdAt");

-- CreateIndex
CREATE INDEX "LinkClick_fixtureId_idx" ON "LinkClick"("fixtureId");

-- CreateIndex
CREATE INDEX "LinkClick_ip_idx" ON "LinkClick"("ip");
