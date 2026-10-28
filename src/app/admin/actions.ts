"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  const expected = process.env.ADMIN_PASSWORD;

  if (password === expected) {
    (await cookies()).set("admin_auth", "true", { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
    redirect("/admin");
  } else {
    redirect("/admin/login?error=1");
  }
}

export async function logoutAction() {
  (await cookies()).delete("admin_auth");
  redirect("/admin/login");
}

export async function addBroadcasterAction(formData: FormData) {
  const prisma = getPrisma();
  await prisma.broadcaster.create({
    data: {
      name: formData.get("name") as string,
      affiliateUrl: formData.get("affiliateUrl") as string,
      logoUrl: (formData.get("logoUrl") as string) || null,
    },
  });
  revalidatePath("/admin/broadcasters");
}

export async function deleteBroadcasterAction(formData: FormData) {
  const prisma = getPrisma();
  await prisma.broadcaster.delete({
    where: { id: Number(formData.get("id")) },
  });
  revalidatePath("/admin/broadcasters");
}

export async function addMappingAction(formData: FormData) {
  const prisma = getPrisma();
  await prisma.leagueBroadcasterMapping.create({
    data: {
      sport: formData.get("sport") as string,
      leagueId: Number(formData.get("leagueId")),
      leagueName: formData.get("leagueName") as string,
      countryCode: (formData.get("countryCode") as string).toUpperCase(),
      broadcasterId: Number(formData.get("broadcasterId")),
    },
  });
  revalidatePath("/admin/mappings");
}

export async function deleteMappingAction(formData: FormData) {
  const prisma = getPrisma();
  await prisma.leagueBroadcasterMapping.delete({
    where: { id: Number(formData.get("id")) },
  });
  revalidatePath("/admin/mappings");
}