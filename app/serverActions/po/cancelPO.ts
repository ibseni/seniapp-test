"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cancelPO(numero_bon_commande: string, userEmail: string) {
  try {
    // Update PO in a transaction
    const po = await db.$transaction(async (tx) => {
      // Get the PO to update
      const po = await tx.bons_commande.findUnique({
        where: {
          numero_bon_commande,
        },
        include: {
          demande_achat: true,
        },
      });

      if (!po) {
        throw new Error("PO not found");
      }

      // Update the PO
      await tx.bons_commande.update({
        where: {
          numero_bon_commande,
        },
        data: {
          statut: "Annulé",
        },
      });
      
      // Update the associated demande_achat to obsolete
      await tx.demandes_achat.update({
        where: {
          id: po.demande_achat.id
        },
        data: { 
          statut: "Obsolète"    
        }
      });
      await tx.audit_logs.create({
        data: {
          id_demande_achat: po.demande_achat.id,
          id_bon_commande: po.id,
          action: "mark_as_obsolete",
          description: `Demande d'achat ${po.demande_achat.numero_demande_achat} marqué comme obsolète`,
          email_utilisateur: userEmail,
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id_demande_achat: po.demande_achat.id,
          id_bon_commande: po.id,
          action: "cancel_po",
          description: `Statut du bon de commande ${po.numero_bon_commande} changé à "Annulé"`,
          email_utilisateur: userEmail,
        },
      });
    });

    revalidatePath("/achats/po");
    revalidatePath("/achats/pr");

    return { success: true };
  } catch (error) {
    console.error("Error canceling PO:", error);
    return { success: false, error: "Failed to cancel PO" };
  }
}
