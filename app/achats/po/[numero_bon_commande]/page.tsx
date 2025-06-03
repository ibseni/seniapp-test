import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { AuditTrail } from "@/components/pr/AuditTrail";
import { getPurchaseOrder } from "@/app/serverActions/po/getPurchaseOrder";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { DownloadPDFButton } from "@/components/po/DownloadPDFButton";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { CancelPOButton } from "@/components/po/CancelPOButton";
import ConfirmPOSentButtonClient from "@/components/po/ConfirmPOSentButton";
import { UpdatePOButton } from "@/components/po/UpdatePOButton";

interface PurchaseOrder {
  id: string;
  numero_bon_commande: string;
  date_creation: Date;
  date_modification: Date;
  statut: string;
  commentaire?: string;
  total: number;
  date_livraison?: Date;
  lignes: POLine[];
  status_envoi: boolean;
  demande_achat: {
    id: string;
    statut: string;
    numero_demande_achat: string;
    demandeur: string;
    projet?: {
      numero_projet: string;
      nom: string;
    };
    fournisseur?: {
      numero_fournisseur: string;
      nom_fournisseur?: string;
      adresse_ligne1?: string;
      ville?: string;
      code_postal?: string;
    };
  };
  audit_logs: {
    id: string;
    created_at: Date;
    action: string;
    description: string;
    email_utilisateur: string;
  }[];
}

interface POLine {
  id: string;
  description_article: string;
  quantite: number;
  prix_unitaire: number;
  commentaire?: string;
  ligne_demande: {
    activite?: {
      numero_activite: string;
      description_fr: string;
    };
  };
}

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ numero_bon_commande: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canRead = permissions.includes("po:read");
  const canCancel = permissions.includes("po:cancel");
  const canConfirmSent = permissions.includes("po:envoi");
  const canUpdate = permissions.includes("po:update");

  if (!canRead) {
    redirect("/unauthorized");
  }

  const poResult = await getPurchaseOrder(resolvedParams.numero_bon_commande);

  if (!poResult.success || !poResult.data) {
    notFound();
  }

  const po = poResult.data as unknown as PurchaseOrder;

  return (
    <div className="px-4 py-8 md:px-8 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col gap-6 relative">
        {(po.statut === "Annulé" || po.statut === "En révision") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="transform -rotate-45 text-red-500/20 text-[150px] font-bold whitespace-nowrap">
              {po.statut.toUpperCase()}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Bon de commande {po.numero_bon_commande}
          </h1>
          <div className="flex gap-2">
            <Link href={`/achats/pr/${po.demande_achat.numero_demande_achat}`}>
              <Button className="w-full h-full" variant="outline">
                Voir la demande d&apos;achat
              </Button>
            </Link>
            <DownloadPDFButton numero_bon_commande={po.numero_bon_commande} />
            {canCancel && po.statut !== "Annulé" && (
              <CancelPOButton
                numero_bon_commande={po.numero_bon_commande}
                userEmail={user.email || ""}
              />
            )}
          </div>
        </div>
        <div className="self-end flex flex-row gap-[10px]">
          {canConfirmSent && (
            <ConfirmPOSentButtonClient
              sent={po.status_envoi}
              id={po.id}
              status={po.statut}
            />
          )}
          {canUpdate && (
            <UpdatePOButton
              po_id={po.id}
              pr_id={po.demande_achat.id}
              pr_status={po.demande_achat.statut}
              po_status={po.statut}
            />
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Projet</div>
            <div>
              {po.demande_achat.projet?.numero_projet} -{" "}
              {po.demande_achat.projet?.nom}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Fournisseur</div>
            <div>
              <div>
                {po.demande_achat.fournisseur?.numero_fournisseur} -{" "}
                {po.demande_achat.fournisseur?.nom_fournisseur}
              </div>
              {po.demande_achat.fournisseur?.adresse_ligne1 && (
                <div className="text-muted-foreground">
                  {po.demande_achat.fournisseur.adresse_ligne1}
                  {po.demande_achat.fournisseur.ville &&
                    po.demande_achat.fournisseur.code_postal && (
                      <div>
                        {po.demande_achat.fournisseur.ville},{" "}
                        {po.demande_achat.fournisseur.code_postal}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Demandeur</div>
            <div>{po.demande_achat.demandeur}</div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Statut</div>
            <div>{po.statut}</div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Date de livraison</div>
            <div>
              {po.date_livraison && formatDate(new Date(po.date_livraison))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Envoyé</div>
            <div>{po.status_envoi ? "Oui" : "Non"}</div>
          </div>

          {po.commentaire && (
            <div className="grid gap-2">
              <div className="font-medium">Commentaire</div>
              <div>{po.commentaire}</div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">
            Articles
          </h2>
          <div className="rounded-md border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">
                    Description
                  </th>
                  <th className="py-3 px-4 text-left font-medium w-24">
                    Quantité
                  </th>
                  <th className="py-3 px-4 text-left font-medium w-32">
                    Prix unitaire
                  </th>
                  <th className="py-3 px-4 text-right font-medium w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {po.lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-b">
                    <td className="py-4 px-4">
                      <div className="whitespace-pre-wrap">
                        {ligne.description_article}
                      </div>
                      {ligne.commentaire && (
                        <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                          {ligne.commentaire}
                        </div>
                      )}
                      {ligne.ligne_demande.activite && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {ligne.ligne_demande.activite.numero_activite} -{" "}
                          {ligne.ligne_demande.activite.description_fr}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">{ligne.quantite}</td>
                    <td className="py-4 px-4 align-top">
                      {Number(ligne.prix_unitaire).toLocaleString("fr-CA", {
                        style: "currency",
                        currency: "CAD",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      {(
                        Number(ligne.prix_unitaire) * ligne.quantite
                      ).toLocaleString("fr-CA", {
                        style: "currency",
                        currency: "CAD",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={3} className="py-4 px-4 text-right font-medium">
                    Total:
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    {Number(po.total).toLocaleString("fr-CA", {
                      style: "currency",
                      currency: "CAD",
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8">
            <AuditTrail logs={po.audit_logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
