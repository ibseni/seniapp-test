"use server";

import { db } from "@/src/lib/prisma";

export async function getFournisseur(id: string) {
  try {
    const fournisseur = await db.fournisseurs.findUnique({
      where: { id },
      select: {
        id: true,
        numero_fournisseur: true,
        nom_fournisseur: true,
        adresse_ligne1: true,
        ville: true,
        code_postal: true,
        telephone1: true,
        poste_telephone1: true,
        telephone2: true,
        telecopieur: true,
        telephone_autre: true,
        nom_responsable: true,
      },
    });

    return { success: true, data: fournisseur };
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return { success: false, error: "Failed to fetch supplier" };
  }
}

export async function getAllFournisseurs() {
  try {
    const fournisseurs = await db.fournisseurs.findMany({
      select: {
        id: true,
        numero_fournisseur: true,
        nom_fournisseur: true,
        adresse_ligne1: true,
        ville: true,
        code_postal: true,
        telephone1: true,
        poste_telephone1: true,
        telephone2: true,
        telecopieur: true,
        telephone_autre: true,
        nom_responsable: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return { success: true, data: fournisseurs };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return { success: false, error: "Failed to fetch suppliers" };
  }
} 