import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupIp } from "@/lib/geoip";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ip, fixtureId, linkUrl, linkTitle, userAgent } = body;
    const geo = await lookupIp(ip);

    await prisma.linkClick.create({
      data: {
        ip,
        fixtureId,
        linkUrl,
        linkTitle,
        userAgent,
        country: geo.country,
        city: geo.city,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("track-click failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}