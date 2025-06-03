import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";

interface PurchaseRequest {
  id: string;
  numero_demande_achat: string;
  statut: string | null;
  date_creation: Date;
  projet: {
    numero_projet: string;
    nom: string;
  } | null;
  fournisseur: {
    numero_fournisseur: string;
    nom_fournisseur: string | null;
  } | null;
}

export async function getUserPurchaseRequests(): Promise<{ success: boolean; data?: PurchaseRequest[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.demandes_achat.findMany({
      where: {
        demandeur: user.email,
      },
      select: {
        id: true,
        numero_demande_achat: true,
        statut: true,
        date_creation: true,
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
      orderBy: {
        date_creation: 'desc',
      },
      take: 10,
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Error fetching user purchase requests:", error);
    return { success: false, error: "Failed to fetch user purchase requests" };
  }
} 