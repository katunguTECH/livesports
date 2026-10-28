import { getPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addBroadcasterAction, deleteBroadcasterAction } from "../actions";

export default async function BroadcastersPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") redirect("/admin/login");

  const prisma = getPrisma();
  const broadcasters = await prisma.broadcaster.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Broadcasters</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Broadcaster</h2>
        <form action={addBroadcasterAction} className="flex flex-col gap-4">
          <input name="name" placeholder="Name (e.g., ESPN+)" required className="border rounded px-3 py-2" />
          <input name="affiliateUrl" placeholder="Affiliate URL" required className="border rounded px-3 py-2" />
          <input name="logoUrl" placeholder="Logo URL (optional)" className="border rounded px-3 py-2" />
          <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-max">Add</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm">Name</th>
              <th className="p-4 font-semibold text-sm">Affiliate URL</th>
              <th className="p-4 font-semibold text-sm w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {broadcasters.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-4">{b.name}</td>
                <td className="p-4 text-blue-600 truncate max-w-xs">{b.affiliateUrl}</td>
                <td className="p-4">
                  <form action={deleteBroadcasterAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-red-600 hover:underline text-sm">Delete</button>
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