
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invalidate } from "@/lib/swr";
import { COMMUNITY_LINKS_KEY } from "@/lib/community-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Retrieve published community links for one match.
export async function GET(request: NextRequest) {
  try {
    const fixtureId = request.nextUrl.searchParams.get("fixtureId");

    if (!fixtureId || fixtureId.length > 300) {
      return NextResponse.json(
        { error: "A valid fixture ID is required." },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const links = await prisma.communityLink.findMany({
      where: {
        fixtureId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        fixtureId: true,
        title: true,
        url: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error("Community links retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve community links." },
      { status: 500 }
    );
  }
}

// Submit and immediately publish a community viewing link.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator login required." },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();

    const fixtureId = String(body.fixtureId ?? "").trim();
    const sport = String(body.sport ?? "").trim();
    const leagueName = String(body.leagueName ?? "").trim();
    const homeName = String(body.homeName ?? "").trim();
    const awayName = String(body.awayName ?? "").trim();
    const title = String(body.title ?? "").trim();
    const rawUrl = String(body.url ?? "").trim();

    if (
      !fixtureId ||
      !sport ||
      !leagueName ||
      !homeName ||
      !awayName ||
      !rawUrl
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (
      fixtureId.length > 300 ||
      sport.length > 50 ||
      leagueName.length > 150 ||
      homeName.length > 150 ||
      awayName.length > 150 ||
      title.length > 100 ||
      rawUrl.length > 2048
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid website URL." },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return NextResponse.json(
        { error: "Only valid HTTP or HTTPS links are accepted." },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const link = await prisma.communityLink.create({
      data: {
        fixtureId,
        sport,
        leagueName,
        homeName,
        awayName,
        title: title || null,
        url: parsedUrl.toString(),
        status: "PUBLISHED",
      },
      select: {
        id: true,
        fixtureId: true,
        title: true,
        url: true,
        status: true,
        createdAt: true,
      },
    });

    invalidate(COMMUNITY_LINKS_KEY);

    return NextResponse.json(
      {
        message: "Your link has been published.",
        link,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This link has already been submitted for this match." },
        { status: 409 }
      );
    }

    console.error("Community link submission failed:", error);

    return NextResponse.json(
      { error: "Unable to submit your link. Please try again." },
      { status: 500 }
    );
  }
}

