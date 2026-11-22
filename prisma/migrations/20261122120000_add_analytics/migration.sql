-- CreateTable
CREATE TABLE "PageVisit" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "userAgent" TEXT,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "match" TEXT,
    "leagueName" TEXT,
    "fixtureId" TEXT,
    "broadcasterCountry" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageVisit_createdAt_idx" ON "PageVisit"("createdAt");

-- CreateIndex
CREATE INDEX "PageVisit_country_idx" ON "PageVisit"("country");

-- CreateIndex
CREATE INDEX "ClickEvent_createdAt_idx" ON "ClickEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ClickEvent_kind_label_idx" ON "ClickEvent"("kind", "label");
