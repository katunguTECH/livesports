import { getPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addMappingAction, deleteMappingAction } from "../actions";

export default async function MappingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") redirect("/admin/login");

  const prisma = getPrisma();
  const [mappings, broadcasters] = await Promise.all([
    prisma.leagueBroadcasterMapping.findMany({
      include: { broadcaster: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.broadcaster.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Broadcaster Mappings</h1>
      {params.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {params.error}
        </div>
      )}
      {params.added && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          Mapping added.
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Mapping</h2>
        <form action={addMappingAction} className="grid grid-cols-2 gap-4">
          <select name="sport" required className="border rounded px-3 py-2">
            <option value="football">Football (Soccer)</option>
            <option value="basketball">Basketball</option>
            <option value="american-football">NFL</option>
            <option value="baseball">Baseball</option>
            <option value="hockey">Hockey</option>
          </select>
          <input
            name="leagueId"
            type="number"
            placeholder="League ID (39, 1001, etc.)"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="leagueName"
            placeholder="League Name (Premier League, NBA)"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="countryCode"
            placeholder="Country (US, KE, GLOBAL)"
            required
            className="border rounded px-3 py-2"
            maxLength={6}
          />
          <select
            name="broadcasterId"
            required
            className="border rounded px-3 py-2 col-span-2"
          >
            <option value="">Select Broadcaster...</option>
            {broadcasters.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-max col-span-2"
          >
            Add Mapping
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm">Sport</th>
              <th className="p-4 font-semibold text-sm">League</th>
              <th className="p-4 font-semibold text-sm">Country</th>
              <th className="p-4 font-semibold text-sm">Broadcaster</th>
              <th className="p-4 font-semibold text-sm w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="p-4 capitalize">{m.sport}</td>
                <td className="p-4">
                  {m.leagueName}{" "}
                  <span className="text-gray-400 text-xs">({m.leagueId})</span>
                </td>
                <td className="p-4 font-mono">{m.countryCode}</td>
                <td className="p-4">{m.broadcaster.name}</td>
                <td className="p-4">
                  <form action={deleteMappingAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}