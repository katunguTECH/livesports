import { loginAction } from "../actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  
  if (cookieStore.get("admin_auth")?.value === "true") {
    redirect("/admin");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        {params.error && <p className="text-red-500 text-sm mb-4 text-center">Incorrect password</p>}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Log In</button>
        </form>
      </div>
    </div>
  );
}