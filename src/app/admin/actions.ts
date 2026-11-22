"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import {
  verifyAdminPassword,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const provided = String(formData.get("password") ?? "").trim();

  if (verifyAdminPassword(provided)) {
    await createAdminSession();
    redirect("/admin");
  }

  redirect("/admin/login?error=1");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function addBroadcasterAction(formData: FormData) {
  await requireAdmin();

  const prisma = getPrisma();

  await prisma.broadcaster.create({
    data: {
      name: String(formData.get("name") ?? "").trim(),
      affiliateUrl: String(formData.get("affiliateUrl") ?? "").trim(),
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
    },
  });

  revalidatePath("/admin/broadcasters");
}

export async function deleteBroadcasterAction(formData: FormData) {
  await requireAdmin();

  const prisma = getPrisma();

  await prisma.broadcaster.delete({
    where: { id: Number(formData.get("id")) },
  });

  revalidatePath("/admin/broadcasters");
}

export async function addMappingAction(formData: FormData) {
  await requireAdmin();

  const prisma = getPrisma();

  try {
    await prisma.leagueBroadcasterMapping.create({
      data: {
        sport: String(formData.get("sport") ?? "").trim(),
        leagueId: Number(formData.get("leagueId")),
        leagueName: String(formData.get("leagueName") ?? "").trim(),
        countryCode: String(formData.get("countryCode") ?? "").trim().toUpperCase(),
        broadcasterId: Number(formData.get("broadcasterId")),
      },
    });
  } catch (err: any) {
    const msg =
      err?.code === "P2002"
        ? "That mapping already exists (same sport, league, and country)."
        : err?.message ?? "Unknown database error";

    console.error("addMappingAction failed:", msg);

    redirect("/admin/mappings?error=" + encodeURIComponent(msg.slice(0, 100)));
  }

  revalidatePath("/admin/mappings");
  redirect("/admin/mappings?added=1");
}

export async function deleteMappingAction(formData: FormData) {
  await requireAdmin();

  const prisma = getPrisma();

  await prisma.leagueBroadcasterMapping.delete({
    where: { id: Number(formData.get("id")) },
  });

  revalidatePath("/admin/mappings");
}
