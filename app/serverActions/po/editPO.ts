"use server";

import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/src/lib/prisma";
import { addAuditLog } from "../pr/addAuditLog";

export const editPO = async (prevState: any, formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = await getUserPermissionsServer(user.id);
  const canEditPO = permissions.includes("po:update");

  if (!canEditPO) {
    return { success: false, error: "Unauthorized" };
  }

  const po_id = formData.get("po_id") as string;
  const pr_id = formData.get("pr_id") as string;
  const currentPO_status = formData.get("currentPO_status") as string;

  try {
    const newPR = await db.$transaction(async (tx) => {
      const deletedLignes = await tx.lignes_bon_commande.deleteMany({
        where: {
          id_bon_commande: po_id,
        },
      });
      if (!deletedLignes) throw new Error("Failed to delete lines");

      const modifiedPO = await tx.bons_commande.update({
        where: {
          id: po_id,
        },
        data: {
          statut: "En révision",
        },
      });
      if (!modifiedPO) throw new Error("Failed to update PO status");

      const modifiedPR = await tx.demandes_achat.update({
        where: {
          id: pr_id,
        },
        data: {
          statut: "Brouillon",
        },
      });
      if (!modifiedPR) throw new Error("Failed to update PR status");

      addAuditLog({
        id_demande_achat: pr_id,
        action: "update_pr",
        description: `Révision de la demande d'achat: Approuvée → ${modifiedPR.statut}`,
        email_utilisateur: user.email || "",
      });

      await tx.audit_logs.create({
        data: {
          id_demande_achat: modifiedPR.id,
          id_bon_commande: modifiedPO.id,
          action: "update_po",
          description: `Révision du bon de commande: ${currentPO_status} → ${modifiedPO.statut}`,
          email_utilisateur: user.email || "",
        },
      });

      return modifiedPR;
    });

    return { success: true, redirectTo: newPR.numero_demande_achat };
  } catch (error) {
		console.error("Unable to edit PO :", error);
		return { success: false, redirectTo: null };
  }
};
