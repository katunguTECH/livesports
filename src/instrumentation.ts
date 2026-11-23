export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getAllFixtures, getGolfTournaments } = await import("./lib/api");
  const warm = () => {
    getAllFixtures().catch(console.error);
    getGolfTournaments().catch(console.error);
  };
  warm();
  setInterval(warm, 65_000);
}