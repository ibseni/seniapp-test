"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { generatePRNumber } from "./generatePRNumber";

export interface PurchaseRequestLineItem {
  description_article: string;
  quantite: number;
  prix_unitaire_estime: number;
  commentaire_ligne?: string;
  id_activite: string;
}

export interface PurchaseRequestAttachment {
  type: string;
  url: string;
}

export interface AddPurchaseRequestData {
  id_projet?: string;
  demandeur?: string;
  statut?: string;
  commentaire?: string;
  id_fournisseur?: string;
  date_livraison_souhaitee?: string | Date;
  delivery_option: "pickup" | "siege_social" | "projet";
  type_livraison: "Boomtruck" | "Flatbed" | "Moffet" | "Camion_Cube" | "Non Applicable";
  relation_compagnie: "fournisseur" | "sous-traitant";
  lignes: PurchaseRequestLineItem[];
  pieces_jointes?: PurchaseRequestAttachment[];
}

export async function addPurchaseRequest(data: AddPurchaseRequestData) {
  try {
    // Generate PR number at submission time
    const numero_demande_achat = await generatePRNumber();

    // Calculate total
    const total_estime = data.lignes.reduce((sum, ligne) => {
      return sum + (ligne.prix_unitaire_estime || 0) * ligne.quantite;
    }, 0);

    // Handle date conversion to preserve local date
    let date_livraison_souhaitee = undefined;
    if (data.date_livraison_souhaitee) {
      if (typeof data.date_livraison_souhaitee === 'string') {
        // Create a new date at noon UTC to avoid any timezone issues
        const [year, month, day] = data.date_livraison_souhaitee.split('-').map(Number);
        date_livraison_souhaitee = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        date_livraison_souhaitee = data.date_livraison_souhaitee;
      }
    }

    const request = await db.demandes_achat.create({
      data: {
        numero_demande_achat,
        projet: data.id_projet ? {
          connect: { id: data.id_projet }
        } : undefined,
        demandeur: data.demandeur,
        statut: data.statut || "Brouillon",
        commentaire: data.commentaire,
        fournisseur: data.id_fournisseur ? {
          connect: { id: data.id_fournisseur }
        } : undefined,
        date_livraison_souhaitee,
        delivery_option: data.delivery_option,
        type_livraison: data.type_livraison,
        relation_compagnie: data.relation_compagnie,
        total_estime,
        date_modification: new Date(),
        lignes: {
          create: data.lignes.map(ligne => ({
            description_article: ligne.description_article,
            quantite: ligne.quantite,
            prix_unitaire_estime: ligne.prix_unitaire_estime,
            commentaire_ligne: ligne.commentaire_ligne,
            activite: {
              connect: { id: ligne.id_activite }
            }
          })),
        },
        pieces_jointes: data.pieces_jointes ? {
          create: data.pieces_jointes.map(piece => ({
            type: piece.type,
            url: piece.url,
          })),
        } : undefined,
      },
      include: {
        lignes: {
          include: {
            activite: true,
          },
        },
        fournisseur: {
          select: {
            numero_fournisseur: true,
            nom_fournisseur: true,
          },
        },
        pieces_jointes: true,
      },
    });

    revalidatePath("/achats/pr");
    return { success: true, data: request };
  } catch (error) {
    console.error("Error adding purchase request:", error);
    return { success: false, error: "Failed to add purchase request" };
  }
} 