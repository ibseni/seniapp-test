"use server";

import { db } from "@/src/lib/prisma";

export async function getActivities() {
  try {
    const activities = await db.activites.findMany({
      where: {
        valid: true,
      },
      orderBy: {
        numero_activite: 'asc',
      },
      select: {
        id: true,
        numero_activite: true,
        description_fr: true,
        description_en: true,
        code_interne: true,
        numero_fournisseur: true,
        numero_gl_achat: true,
      },
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { success: false, error: "Failed to fetch activities" };
  }
} 