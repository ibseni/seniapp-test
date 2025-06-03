"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export interface AddProjectData {
  numero_projet: string;
  nom: string;
  addresse: string;
  addresseLivraison?: string;
  id_dossier_commande?: string;
  surintendant?: string;
  coordonateur_projet?: string;
  charge_de_projet?: string;
  directeur_de_projet?: string;
}

export async function addProject(data: AddProjectData) {
  try {
    // Check user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check user permissions
    const permissions = await getUserPermissionsServer(user.id);
    if (!permissions.includes('projects:create')) {
      return { 
        success: false, 
        error: "Permission denied: You don't have permission to create projects" 
      };
    }

    const project = await db.projets.create({
      data: {
        numero_projet: data.numero_projet,
        nom: data.nom,
        addresse: data.addresse,
        addresseLivraison: data.addresseLivraison,
        id_dossier_commande: data.id_dossier_commande,
        surintendant: data.surintendant,
        coordonateur_projet: data.coordonateur_projet,
        charge_de_projet: data.charge_de_projet,
        directeur_de_projet: data.directeur_de_projet,
      },
    });

    revalidatePath("/projets");
    return { success: true, data: project };
  } catch (error) {
    console.error("Error adding project:", error);
    return { success: false, error: "Failed to add project" };
  }
} 