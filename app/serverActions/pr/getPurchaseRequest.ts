"use server";

import { db } from "@/src/lib/prisma";
import { demandes_achat, activites, projets, fournisseurs, audit_logs, pieces_jointes } from "@prisma/client";

type DeliveryOption = "pickup" | "siege_social" | "projet";

type PurchaseRequestWithRelations = demandes_achat & {
  lignes: {
    activite: activites | null;
    id: string;
    description_article: string;
    quantite: number;
    prix_unitaire_estime: number;
    commentaire_ligne: string | null;
    id_activite: string | null;
  }[];
  projet: projets | null;
  fournisseur: fournisseurs | null;
  audit_logs: audit_logs[];
  pieces_jointes: pieces_jointes[];
  bons_commande?: {
    numero_bon_commande: string;
  }[];
};

export async function getPurchaseRequest(numero_demande_achat: string) {
  try {
    const pr = await db.demandes_achat.findUnique({
      where: { numero_demande_achat },
      include: {
        lignes: {
          include: {
            activite: true,
          },
        },
        projet: true,
        fournisseur: true,
        audit_logs: {
          orderBy: {
            created_at: "desc",
          },
        },
        pieces_jointes: {
          orderBy: {
            date_creation: "desc",
          },
        },
        bons_commande: {
          select: {
            numero_bon_commande: true,
          },
        },
      },
    });

    if (!pr) {
      return { success: false, error: "Purchase request not found" };
    }

    return { success: true, data: pr };
  } catch (error) {
    console.error("Error getting purchase request:", error);
    return { success: false, error: "Failed to get purchase request" };
  }
} 