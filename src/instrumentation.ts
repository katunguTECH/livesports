export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getAllFixtures, getGolfTournaments } = await import("./lib/api");
  const warm = () => {
    getAllFixtures().catch(console.error);
    getGolfTournaments().catch(console.error);
  };
  warm();
  setInterval(warm, 65_000);

  // Keep the Neon compute awake (it suspends after ~5 minutes idle)
  const { getPrisma } = await import("./lib/prisma");
  const ping = () => getPrisma().$queryRaw`SELECT 1`.catch(console.error);
  ping();
  setInterval(ping, 4 * 60_000);
}