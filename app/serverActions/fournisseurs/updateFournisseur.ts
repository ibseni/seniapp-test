"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UpdateFournisseurData {
  numero_fournisseur?: string;
  nom_fournisseur?: string;
  adresse_ligne1?: string;
  ville?: string;
  code_postal?: string;
  telephone1?: string;
  poste_telephone1?: string;
  telephone2?: string;
  telecopieur?: string;
  telephone_autre?: string;
  nom_responsable?: string;
}

export async function updateFournisseur(id: string, data: UpdateFournisseurData) {
  try {
    const fournisseur = await db.fournisseurs.update({
      where: { id },
      data: {
        numero_fournisseur: data.numero_fournisseur,
        nom_fournisseur: data.nom_fournisseur,
        adresse_ligne1: data.adresse_ligne1,
        ville: data.ville,
        code_postal: data.code_postal,
        telephone1: data.telephone1,
        poste_telephone1: data.poste_telephone1,
        telephone2: data.telephone2,
        telecopieur: data.telecopieur,
        telephone_autre: data.telephone_autre,
        nom_responsable: data.nom_responsable,
      },
    });

    revalidatePath("/achats/fournisseurs");
    return { success: true, data: fournisseur };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Failed to update supplier" };
  }
} 