import { getPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") redirect("/admin/login");

  const prisma = getPrisma();
  const [broadcasterCount, mappingCount] = await Promise.all([
    prisma.broadcaster.count(),
    prisma.leagueBroadcasterMapping.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-sm text-gray-500 uppercase">Total Broadcasters</h2>
          <p className="text-4xl font-bold text-gray-900">{broadcasterCount}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-sm text-gray-500 uppercase">Total Mappings</h2>
          <p className="text-4xl font-bold text-gray-900">{mappingCount}</p>
        </div>
      </div>
    </div>
  );
}