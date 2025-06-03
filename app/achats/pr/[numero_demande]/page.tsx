import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/utils/format";
import { AuditTrail } from "@/components/pr/AuditTrail";
import { updatePurchaseRequest } from "@/app/serverActions/pr/updatePurchaseRequest";
import { getPurchaseRequest } from "@/app/serverActions/pr/getPurchaseRequest";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createPurchaseOrder } from "@/app/serverActions/po/createPurchaseOrder";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function PurchaseRequestPage({
  params,
}: {
  params: Promise<{ numero_demande: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { success, data: pr, error } = await getPurchaseRequest(resolvedParams.numero_demande);

  if (!success || !pr) {
    notFound();
  }

  const canEdit = pr.statut === "Brouillon" || pr.statut === "En Attente N1" || pr.statut === "En Attente N2" || pr.statut === "Refusé";
  const permissions = await getUserPermissionsServer(user.id);
  
  const canApprove = permissions.includes('pr:aprobation');
  const isProjectManager = user.email === pr.projet?.charge_de_projet;

  return (
    <div className="px-4 py-8 md:px-8 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Demande d&apos;achat {pr.numero_demande_achat}
          </h1>
          <div className="flex gap-2">
            {pr.bons_commande && pr.bons_commande.length > 0 && (
              <Link href={`/achats/po/${pr.bons_commande[0].numero_bon_commande}`}>
                <Button variant="outline">
                  Voir Bon de commande
                </Button>
              </Link>
            )}
            {pr.statut === "Brouillon" && (
              <form
                action={async () => {
                  "use server";
                  await updatePurchaseRequest({
                    id: pr.id,
                    statut: "En Attente N1",
                    demandeur: user.email,
                  });
                }}
              >
                <Button type="submit">Soumettre pour approbation</Button>
              </form>
            )}
            {pr.statut === "En Attente N2" && canApprove && (
              <div className="flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    if (!user?.email) {
                      return;
                    }
                    console.log("Updating purchase request to approved");
                    const updateResult = await updatePurchaseRequest({
                      id: pr.id,
                      statut: "Approuvé",
                      demandeur: user.email,
                    });

                    if (updateResult.success) {
                      // Create purchase order
                      const poResult = await createPurchaseOrder(pr.id, user.email);
                      if (!poResult.success || !poResult.data) {
                        throw new Error("Failed to create purchase order");
                      }
                      // Redirect to the list of purchase requests
                      redirect(`/achats/pr`);
                    }
                  }}
                >
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Approuver N2
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    if (!user?.email) {
                      return;
                    }
                    await updatePurchaseRequest({
                      id: pr.id,
                      statut: "Refusé",
                      demandeur: user.email,
                    });
                  }}
                >
                  <Button type="submit" variant="destructive">
                    Refuser
                  </Button>
                </form>
              </div>
            )}
            {pr.statut === "En Attente N1" && (isProjectManager || canApprove) && (
              <div className="flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    if (!user?.email) {
                      return;
                    }
                    console.log("Updating purchase request to approved");
                    const updateResult = await updatePurchaseRequest({
                      id: pr.id,
                      statut: "En Attente N2",
                      demandeur: user.email,
                    });

                    if (updateResult.success) {
                      
                      
                      // Redirect to the list of purchase requests
                      redirect(`/achats/pr`);
                    }
                  }}
                >
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Approuver N1
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    if (!user?.email) {
                      return;
                    }
                    await updatePurchaseRequest({
                      id: pr.id,
                      statut: "Refusé",
                      demandeur: user.email,
                    });
                  }}
                >
                  <Button type="submit" variant="destructive">
                    Refuser
                  </Button>
                </form>
              </div>
            )}
            {pr.statut === "Refusé" && (
              <form
                action={async () => {
                  "use server";
                  await updatePurchaseRequest({
                    id: pr.id,
                    statut: "En Attente N1",
                    demandeur: user.email,
                  });
                }}
              >
                <Button type="submit">Resoumettre</Button>
              </form>
            )}
            {canEdit && (
              <Link href={`/achats/pr/${pr.numero_demande_achat}/edit`}>
                <Button variant="outline">Modifier</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Projet</div>
            <div>
              {pr.projet?.numero_projet} - {pr.projet?.nom}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Fournisseur</div>
            <div>
              {pr.fournisseur?.numero_fournisseur} - {pr.fournisseur?.nom_fournisseur}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Demandeur</div>
            <div>{pr.demandeur}</div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Statut</div>
            <div>{pr.statut}</div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Date de livraison souhaitée</div>
            <div>
              {pr.date_livraison_souhaitee &&
                formatDate(pr.date_livraison_souhaitee)}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Option de livraison</div>
            <div>
              {pr.delivery_option === "pickup" && "Ramassage"}
              {pr.delivery_option === "siege_social" && "Siège social"}
              {pr.delivery_option === "projet" && (
                <>
                  Adresse de livraison du projet:
                  <div className="text-muted-foreground mt-1">
                    {pr.projet?.addresseLivraison || "Non spécifiée"}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">Type de livraison</div>
            <div>{pr.type_livraison}</div>
          </div>

          {pr.commentaire && (
            <div className="grid gap-2">
              <div className="font-medium">Commentaire</div>
              <div>{pr.commentaire}</div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Articles</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Quantité</th>
                <th className="py-3 px-4 text-left">Prix unitaire</th>
                <th className="py-3 px-4 text-left">Activité</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pr.lignes.map((ligne, index) => (
                <tr key={ligne.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="py-4 px-4">
                    <div className="whitespace-pre-wrap">{ligne.description_article}</div>
                    {ligne.commentaire_ligne && (
                      <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {ligne.commentaire_ligne}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top">{ligne.quantite}</td>
                  <td className="py-4 px-4 align-top">
                    {ligne.prix_unitaire_estime?.toLocaleString("fr-CA", {
                      style: "currency",
                      currency: "CAD",
                    })}
                  </td>
                  <td className="py-4 px-4 align-top">
                    {ligne.activite?.numero_activite} - {ligne.activite?.description_fr}
                  </td>
                  <td className="py-4 px-4 text-right align-top">
                    {((ligne.prix_unitaire_estime || 0) * ligne.quantite).toLocaleString(
                      "fr-CA",
                      {
                        style: "currency",
                        currency: "CAD",
                      }
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2">
                <td colSpan={4} className="py-4 px-4 text-right font-medium">Total estimé:</td>
                <td className="py-4 px-4 text-right font-medium">
                  {pr.total_estime?.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pièces justificatives</CardTitle>
          </CardHeader>
          <CardContent>
            {pr.pieces_jointes && pr.pieces_jointes.length > 0 ? (
              <div className="space-y-2">
                {pr.pieces_jointes.map((piece) => (
                  <div key={piece.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium">{piece.type}</div>
                      <Link
                        href={piece.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:underline"
                      >
                        {piece.url}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucune pièce jointe</div>
            )}
          </CardContent>
        </Card>

        <AuditTrail logs={pr.audit_logs} />
      </div>
    </div>
  );
} 