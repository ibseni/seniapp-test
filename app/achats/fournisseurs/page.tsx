import { getAllFournisseurs } from "@/app/serverActions/fournisseurs/getFournisseur";
import { FournisseursTable } from "@/components/fournisseurs/FournisseursTable";
import { ImportFournisseursButton } from "@/components/fournisseurs/ImportFournisseursButton";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Phone, Users2, Truck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function FournisseursPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canRead = permissions.includes('suppliers:read');
  const canCreate = permissions.includes('suppliers:create');
  const canImport = permissions.includes('suppliers:import');
  const canDelete = permissions.includes('suppliers:delete');

  if (!canRead) {
    redirect("/unauthorized");
  }

  const { data: fournisseurs, error } = await getAllFournisseurs();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement des fournisseurs
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalFournisseurs = fournisseurs?.length || 0;
  const activeFournisseurs = Math.floor(totalFournisseurs * 0.8); // Example calculation
  const totalContacts = fournisseurs?.reduce((acc: number, f: any) => {
    let count = 0;
    if (f.nom_responsable) count++;
    if (f.telephone1) count++;
    return acc + count;
  }, 0) || 0;
  const villesUniques = new Set(fournisseurs?.map((f: any) => f.ville)).size;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Fournisseurs</h1>
        {canImport && (
          <div className="flex gap-4">
            <ImportFournisseursButton />
            
          </div>
        )}
        {
          canCreate && (
            <Link href="/achats/fournisseurs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Fournisseur
              </Button>
            </Link>
          )
        }
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Fournisseurs
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFournisseurs}</div>
            <p className="text-xs text-muted-foreground">
              {activeFournisseurs} fournisseurs actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Villes
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{villesUniques}</div>
            <p className="text-xs text-muted-foreground">
              Villes desservies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contacts
            </CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Points de contact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Communications
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFournisseurs}</div>
            <p className="text-xs text-muted-foreground">
              Lignes de communication
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <FournisseursTable data={fournisseurs || []} canDelete={canDelete} />
      </div>
    </div>
  );
} 