import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { db } from "@/src/lib/prisma";
import AvantageClient from "./AvantageClient";

export default async function AvantagePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canRead = permissions.includes('po:export');

  if (!canRead) {
    redirect("/unauthorized");
  }

  // Get all PO lines with amount > 0
  const poLines = await db.lignes_bon_commande.findMany({
    where: {
      prix_unitaire: {
        gt: 0
      },
      bon_commande: {
        statut: "En cours"
      }
    },
    select: {
      bon_commande: {
        select: {
          numero_bon_commande: true,
          date_creation: true,
          demande_achat: {
            select: {
              fournisseur: {
                select: {
                  numero_fournisseur: true
                }
              },
              projet: {
                select: {
                  numero_projet: true
                }
              }
            }
          }
        }
      },
      ligne_demande: {
        select: {
          activite: {
            select: {
              numero_activite: true
            }
          }
        }
      },
      prix_unitaire: true,
      quantite: true
    },
    orderBy: {
      bon_commande: {
        numero_bon_commande: 'desc'
      }
    }
  });

  // Convert Decimal to number before passing to client component
  const serializedLines = poLines.map(line => ({
    ...line,
    prix_unitaire: Number(line.prix_unitaire)
  }));

  return <AvantageClient initialData={serializedLines} userEmail={user.email || ''} />;
}
