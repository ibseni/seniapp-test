"use server";

import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export async function getPurchaseOrder(numero_bon_commande: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes('po:read');

    if (!canRead) {
      return { success: false, error: "Unauthorized" };
    }

    const po = await db.bons_commande.findUnique({
      where: { numero_bon_commande },
      include: {
        lignes: {
          include: {
            ligne_demande: {
              include: {
                activite: true,
              },
            },
          },
        },
        demande_achat: {
          include: {
            projet: true,
            fournisseur: true,
          },
        },
        audit_logs: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    return { success: true, data: po };
  } catch (error) {
    console.error("Error getting purchase order:", error);
    return { success: false, error: "Failed to get purchase order" };
  }
} 