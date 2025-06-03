import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/src/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getPurchaseOrdersByProject } from "@/app/serverActions/po/getPurchaseOrdersByProject";
import { formatDate } from "@/utils/format";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ numero_projet: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = await db.projets.findUnique({
    where: { numero_projet: resolvedParams.numero_projet },
  });

  if (!project) {
    notFound();
  }

  const { success, data: pos, total = 0 } = await getPurchaseOrdersByProject(project.id);

  return (
    <div className="px-4 md:px-6 py-6 w-full">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.numero_projet}
            </h1>
            <span className="text-muted-foreground">-</span>
            <h2 className="text-3xl tracking-tight">
              {project.nom}
            </h2>
          </div>
          <Link href={`/projets/${project.numero_projet}/edit`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Détails du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">Total des bons de commande</div>
                <div className="text-2xl font-bold">
                  {total.toLocaleString("fr-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
                </div>
              </div>
              <div>
                <div className="font-medium">Adresse</div>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {project.addresse}
                </div>
              </div>
              {project.addresseLivraison && (
                <div>
                  <div className="font-medium">Adresse de livraison</div>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {project.addresseLivraison}
                  </div>
                </div>
              )}
              {project.id_dossier_commande && (
                <div>
                  <div className="font-medium">ID Dossier commande</div>
                  <div className="text-muted-foreground">
                    {project.id_dossier_commande}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Équipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.surintendant && (
                <div>
                  <div className="font-medium">Surintendant</div>
                  <a 
                    href={`mailto:${project.surintendant}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.surintendant}
                  </a>
                </div>
              )}
              {project.coordonateur_projet && (
                <div>
                  <div className="font-medium">Coordonateur</div>
                  <a 
                    href={`mailto:${project.coordonateur_projet}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.coordonateur_projet}
                  </a>
                </div>
              )}
              {project.charge_de_projet && (
                <div>
                  <div className="font-medium">Chargé de projet</div>
                  <a 
                    href={`mailto:${project.charge_de_projet}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.charge_de_projet}
                  </a>
                </div>
              )}
              {project.directeur_de_projet && (
                <div>
                  <div className="font-medium">Directeur</div>
                  <a 
                    href={`mailto:${project.directeur_de_projet}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.directeur_de_projet}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bons de commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3">Numéro</th>
                    <th scope="col" className="px-6 py-3">Fournisseur</th>
                    <th scope="col" className="px-6 py-3">Date création</th>
                    <th scope="col" className="px-6 py-3">Statut</th>
                    <th scope="col" className="px-6 py-3 text-right">Total</th>
                    <th scope="col" className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {success && pos?.map((po: any) => (
                    <tr key={po.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4">{po.numero_bon_commande}</td>
                      <td className="px-6 py-4">
                        {po.demande_achat.fournisseur?.nom_fournisseur}
                      </td>
                      <td className="px-6 py-4">{formatDate(po.date_creation)}</td>
                      <td className="px-6 py-4">{po.statut}</td>
                      <td className="px-6 py-4 text-right">
                        {Number(po.total).toLocaleString("fr-CA", {
                          style: "currency",
                          currency: "CAD",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/achats/po/${po.numero_bon_commande}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 