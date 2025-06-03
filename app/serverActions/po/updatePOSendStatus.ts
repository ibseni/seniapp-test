"use server";

import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export const updateSendStatus = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissions = await getUserPermissionsServer(user.id);
  const canConfirmSent = permissions.includes("po:envoi");

  if (!canConfirmSent) {
    return { success: false, error: "Unauthorized" };
  }

  await db.$transaction(async (tx) => {
    const updatedPO = await tx.bons_commande.update({
      where: {
        id: formData.get("id") as string,
      },
      data: {
        status_envoi: true,
      },
    });

    console.log("Updated PO:", updatedPO);

    await tx.audit_logs.create({
      data: {
        id_demande_achat: updatedPO.id_demande_achat,
        id_bon_commande: updatedPO.id,
        action: "envoi_po",
        description: `Confirmation de l'envoi du bon de commande ${updatedPO.numero_bon_commande}`,
        email_utilisateur: user.email || "",
      },
    });
  });
  revalidatePath(`/achats/po/${formData.get("id")}`);
};
