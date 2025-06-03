"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { PurchaseRequestLineItem } from "./addPurchaseRequest";
import { addAuditLog } from "./addAuditLog";

type DeliveryOption = "pickup" | "siege_social" | "projet";
type TypeLivraison = "Boomtruck" | "Flatbed" | "Moffet" | "Camion_Cube" | "Non Applicable";
type RelationCompagnie = "fournisseur" | "sous-traitant";

export interface UpdatePurchaseRequestData {
  id: string;
  numero_demande_achat?: string;
  id_projet?: string;
  demandeur?: string;
  statut?: string;
  commentaire?: string;
  id_fournisseur?: string;
  relation_compagnie?: RelationCompagnie;
  date_livraison_souhaitee?: string;
  delivery_option?: DeliveryOption;
  type_livraison?: TypeLivraison;
  pieces_jointes?: {
    type: string;
    url: string;
  }[];
  lignes?: {
    create?: Omit<PurchaseRequestLineItem & { id_activite: string }, 'id'>[];
    update?: (PurchaseRequestLineItem & { id: string; id_activite: string })[];
    delete?: string[];
  };
}

export async function updatePurchaseRequest(data: UpdatePurchaseRequestData) {
  try {
    const { id, lignes, pieces_jointes, ...updateData } = data;

    // Handle date conversion to preserve local date
    let date_livraison_souhaitee: Date | undefined = undefined;
    if (updateData.date_livraison_souhaitee) {
      if (typeof updateData.date_livraison_souhaitee === 'string') {
        // Create a new date at noon UTC to avoid any timezone issues
        const [year, month, day] = updateData.date_livraison_souhaitee.split('-').map(Number);
        date_livraison_souhaitee = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        date_livraison_souhaitee = updateData.date_livraison_souhaitee;
      }
      delete updateData.date_livraison_souhaitee;
    }

    // Start a transaction to handle line items updates
    const request = await db.$transaction(async (tx) => {
      // Handle line items updates if lignes is provided
      if (lignes !== undefined) {
        // First, get all existing line IDs for this PR
        const existingLines = await tx.lignes_demande_achat.findMany({
          where: { id_demande_achat: id },
          select: { id: true }
        });
        const existingLineIds = existingLines.map(line => line.id);

        // Determine which lines should be kept (those being updated)
        const lineIdsToKeep = new Set(lignes.update?.map(line => line.id) || []);
        
        // Delete all lines that aren't being updated
        const lineIdsToDelete = existingLineIds.filter(id => !lineIdsToKeep.has(id));
        if (lineIdsToDelete.length > 0) {
          await tx.lignes_demande_achat.deleteMany({
            where: {
              id: { in: lineIdsToDelete },
              id_demande_achat: id
            }
          });
        }

        // Update existing lines
        if (lignes.update?.length) {
          for (const ligne of lignes.update) {
            await tx.lignes_demande_achat.update({
              where: { 
                id: ligne.id,
                id_demande_achat: id
              },
              data: {
                description_article: ligne.description_article,
                quantite: ligne.quantite,
                prix_unitaire_estime: ligne.prix_unitaire_estime,
                commentaire_ligne: ligne.commentaire_ligne,
                id_activite: ligne.id_activite,
              },
            });
          }
        }

        // Create new lines
        if (lignes.create?.length) {
          await tx.lignes_demande_achat.createMany({
            data: lignes.create.map(ligne => ({
              ...ligne,
              id_demande_achat: id,
            })),
          });
        }
      }

      // Delete existing attachments and create new ones only if pieces_jointes is provided
      if (pieces_jointes !== undefined) {
        await tx.pieces_jointes.deleteMany({
          where: { id_demande_achat: id },
        });
        
        if (pieces_jointes.length > 0) {
          await tx.pieces_jointes.createMany({
            data: pieces_jointes.map(piece => ({
              ...piece,
              id_demande_achat: id,
            })),
          });
        }
      }

      // Get all current line items to calculate total
      const currentLines = await tx.lignes_demande_achat.findMany({
        where: { id_demande_achat: id },
      });

      // Calculate new total
      const total_estime = currentLines.reduce((sum, ligne) => {
        return sum + (ligne.prix_unitaire_estime || 0) * ligne.quantite;
      }, 0);

      // Get the current PR to check for status change
      const currentPR = await tx.demandes_achat.findUnique({
        where: { id },
        select: { statut: true, demandeur: true },
      });

      // Remove demandeur from updateData if it already exists
      if (currentPR?.demandeur) {
        delete updateData.demandeur;
      }

      // Update the main purchase request
      const updatedPR = await tx.demandes_achat.update({
        where: { id },
        data: {
          ...updateData,
          date_livraison_souhaitee,
          total_estime,
          date_modification: new Date(),
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
          pieces_jointes: {
            orderBy: {
              date_creation: 'desc',
            },
          },
        },
      });

      // If status has changed, create an audit log
      if (updateData.statut && currentPR?.statut !== updateData.statut) {
        await addAuditLog({
          id_demande_achat: id,
          action: "changement_statut",
          description: `Changement de statut: ${currentPR?.statut || 'Aucun'} → ${updateData.statut}`,
          email_utilisateur: data.demandeur || 'Système',
        });
      }

      return updatedPR;
    });

    revalidatePath("/achats/pr");
    return { success: true, data: request };
  } catch (error) {
    console.error("Error updating purchase request:", error);
    return { success: false, error: "Failed to update purchase request" };
  }
} 