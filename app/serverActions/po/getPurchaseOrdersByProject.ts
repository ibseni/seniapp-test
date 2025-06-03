"use server";

import { db } from "@/src/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

interface PurchaseOrder {
  id: string;
  numero_bon_commande: string;
  total: Decimal;
  date_creation: Date;
  statut: string;
  demande_achat: {
    fournisseur: {
      nom_fournisseur: string | null;
    } | null;
  };
}

export async function getPurchaseOrdersByProject(id_projet: string) {
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

    const pos = await db.bons_commande.findMany({
      where: {
        demande_achat: {
          id_projet,
        },
      },
      include: {
        demande_achat: {
          include: { 
            fournisseur: true,
          },
        },
        lignes: true,
      },
      orderBy: {
        date_creation: 'desc',
      },
    });

    // Calculate total of all POs
    const total = pos.reduce((sum: number, po: PurchaseOrder) => sum + Number(po.total), 0);

    return { success: true, data: pos, total };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return { success: false, error: "Failed to fetch purchase orders" };
  }
} 