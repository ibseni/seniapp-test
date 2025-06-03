"use server";

import { db } from "@/src/lib/prisma";
import { generatePONumber } from "./generatePONumber";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export async function createPurchaseOrder(
  id_demande_achat: string,
  user_email: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canCreate = permissions.includes("po:create");

    if (!canCreate) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the PR details
    const pr = await db.demandes_achat.findUnique({
      where: { id: id_demande_achat },
      include: {
        lignes: true,
      },
    });

    if (!pr) {
      return { success: false, error: "Purchase request not found" };
    }

    if (pr.statut !== "Approuvé") {
      return {
        success: false,
        error: "Purchase request must be approved first",
      };
    }

    // Check if PO already exists for this PR
    const existingPO = await db.bons_commande.findFirst({
      where: { id_demande_achat: id_demande_achat },
    });

    if (existingPO) {
      // Calculate total from PR lines
      const total = new Decimal(
        pr.lignes.reduce((sum, ligne) => {
          return sum + (ligne.prix_unitaire_estime || 0) * ligne.quantite;
        }, 0)
      );

      // n = existingPO.numero_bon_commande;
      let n = existingPO.numero_bon_commande;
      if (n.includes("-R")) {
        n = n.substring(0, n.length - 1) + (Number(n.charAt(n.length - 1)) + 1);
      } else n += "-R1";

      // Create PO with its lines in a transaction
      const po = await db.$transaction(async (tx) => {
        // Create PO
        const modifiedPO = await tx.bons_commande.update({
          where: {
            id: existingPO.id,
          },
          data: {
            statut: "En cours",
            numero_bon_commande: n,
            total,
            date_livraison: pr.date_livraison_souhaitee,
            delivery_option: pr.delivery_option,
            type_livraison: pr.type_livraison,
            lignes: {
              create: pr.lignes.map((ligne) => ({
                id_ligne_demande: ligne.id,
                description_article: ligne.description_article,
                quantite: ligne.quantite,
                prix_unitaire: new Decimal(ligne.prix_unitaire_estime || 0),
                commentaire: ligne.commentaire_ligne,
              })),
            },
          },
          include: {
            lignes: true,
            demande_achat: {
              include: {
                fournisseur: true,
              },
            },
          },
        });

        // Create audit log
        await tx.audit_logs.create({
          data: {
            id_demande_achat,
            id_bon_commande: modifiedPO.id,
            action: "creation_po",
            description: `Application de modification du bon de commande ${n}`,
            email_utilisateur: user_email,
          },
        });

        return modifiedPO;
      });

      revalidatePath("/achats/po");
      revalidatePath("/achats/pr");

      return { success: true, data: po };
    }

    // Generate PO number
    const numero_bon_commande = await generatePONumber();

    // Calculate total from PR lines
    const total = new Decimal(
      pr.lignes.reduce((sum, ligne) => {
        return sum + (ligne.prix_unitaire_estime || 0) * ligne.quantite;
      }, 0)
    );

    // Create PO with its lines in a transaction
    const po = await db.$transaction(async (tx) => {
      // Create PO
      const createdPO = await tx.bons_commande.create({
        data: {
          numero_bon_commande,
          id_demande_achat,
          total,
          date_livraison: pr.date_livraison_souhaitee,
          delivery_option: pr.delivery_option,
          type_livraison: pr.type_livraison,
          lignes: {
            create: pr.lignes.map((ligne) => ({
              id_ligne_demande: ligne.id,
              description_article: ligne.description_article,
              quantite: ligne.quantite,
              prix_unitaire: new Decimal(ligne.prix_unitaire_estime || 0),
              commentaire: ligne.commentaire_ligne,
            })),
          },
        },
        include: {
          lignes: true,
          demande_achat: {
            include: {
              fournisseur: true,
            },
          },
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id_demande_achat,
          id_bon_commande: createdPO.id,
          action: "creation_po",
          description: `Création du bon de commande ${numero_bon_commande}`,
          email_utilisateur: user_email,
        },
      });

      return createdPO;
    });

    revalidatePath("/achats/po");
    revalidatePath("/achats/pr");

    return { success: true, data: po };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { success: false, error: "Failed to create purchase order" };
  }
}
