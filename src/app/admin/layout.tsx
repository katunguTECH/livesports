import { cookies } from "next/headers";
import Link from "next/link";
import { logoutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get("admin_auth")?.value === "true";

  if (!isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-xs text-gray-400">livesports</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800">Dashboard</Link>
          <Link href="/admin/broadcasters" className="block px-4 py-2 rounded hover:bg-gray-800">Broadcasters</Link>
          <Link href="/admin/mappings" className="block px-4 py-2 rounded hover:bg-gray-800">Mappings</Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <form action={logoutAction}>
            <button type="submit" className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 text-red-400">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}