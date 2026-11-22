import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupIp } from "@/lib/geoip";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, ip, userAgent, referrer } = body;
    const geo = await lookupIp(ip);

    await prisma.siteVisit.create({
      data: {
        ip,
        path,
        userAgent,
        referrer,
        country: geo.country,
        city: geo.city,
        region: geo.region,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("track-visit failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}