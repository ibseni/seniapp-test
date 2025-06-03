"use server";

import { db } from "@/src/lib/prisma";

export async function updatePOStatus(poNumbers: string[], userEmail: string) {
  try {
    // Use a transaction to ensure both the status update and audit logs are created
    await db.$transaction(async (tx) => {
      // First get the POs to update
      const pos = await tx.bons_commande.findMany({
        where: {
          numero_bon_commande: {
            in: poNumbers
          }
        },
        select: {
          id: true,
          numero_bon_commande: true,
          demande_achat: {
            select: {
              id: true
            }
          }
        }
      });

      // Update all POs in the list
      await tx.bons_commande.updateMany({
        where: {
          numero_bon_commande: {
            in: poNumbers
          }
        },
        data: {
          statut: "Importé"
        }
      });

      // Create audit logs for each PO
      for (const po of pos) {
        await tx.audit_logs.create({
          data: {
            id_demande_achat: po.demande_achat.id,
            id_bon_commande: po.id,
            action: "update_status",
            description: `Statut du bon de commande ${po.numero_bon_commande} changé à "Importé"`,
            email_utilisateur: userEmail,
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating PO status:", error);
    return { success: false, error: "Failed to update PO status" };
  }
} 