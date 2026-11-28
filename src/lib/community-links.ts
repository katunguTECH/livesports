import { getPrisma } from "./prisma";
import { swr } from "./swr";

export const COMMUNITY_LINKS_KEY = "community-links";

export type PublishedLink = {
  id: number;
  fixtureId: string;
  title: string | null;
  url: string;
  status: string;
  createdAt: string;
};

/** All published community links, grouped by fixture ID. Cached for 30s. */
export function getPublishedLinks(): Promise<Map<string, PublishedLink[]>> {
  return swr(COMMUNITY_LINKS_KEY, 30_000, async () => {
    const links = await getPrisma().communityLink.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        fixtureId: true,
        title: true,
        url: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const byFixture = new Map<string, PublishedLink[]>();
    for (const link of links) {
      const list = byFixture.get(link.fixtureId) ?? [];
      list.push({ ...link, createdAt: link.createdAt.toISOString() });
      byFixture.set(link.fixtureId, list);
    }
    return byFixture;
  });
}
