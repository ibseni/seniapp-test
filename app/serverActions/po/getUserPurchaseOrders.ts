import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";

interface PurchaseOrder {
  id: string;
  numero_bon_commande: string;
  statut: string;
  total: number;
  date_creation: Date;
  demande_achat: {
    numero_demande_achat: string;
    projet: {
      numero_projet: string;
      nom: string;
    } | null;
    fournisseur: {
      numero_fournisseur: string;
      nom_fournisseur: string | null;
    } | null;
  };
}

export async function getUserPurchaseOrders(): Promise<{ success: boolean; data?: PurchaseOrder[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const orders = await db.bons_commande.findMany({
      where: {
        demande_achat: {
          demandeur: user.email,
        },
      },
      select: {
        id: true,
        numero_bon_commande: true,
        statut: true,
        total: true,
        date_creation: true,
        demande_achat: {
          select: {
            numero_demande_achat: true,
            projet: {
              select: {
                numero_projet: true,
                nom: true,
              },
            },
            fournisseur: {
              select: {
                numero_fournisseur: true,
                nom_fournisseur: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_creation: 'desc',
      },
      take: 10,
    });

    // Convert Decimal values to numbers in the response
    const formattedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
    }));

    return { success: true, data: formattedOrders };
  } catch (error) {
    console.error("Error fetching user purchase orders:", error);
    return { success: false, error: "Failed to fetch user purchase orders" };
  }
} 