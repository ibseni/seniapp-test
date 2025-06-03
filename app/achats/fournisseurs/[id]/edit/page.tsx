import { FournisseurForm } from "@/components/fournisseurs/FournisseurForm";
import { getFournisseur } from "@/app/serverActions/fournisseurs/getFournisseur";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function EditFournisseurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canUpdate = permissions.includes('suppliers:update');

  if (!canUpdate) {
    redirect("/unauthorized");
  }

  const { data: fournisseur, error } = await getFournisseur(resolvedParams.id);

  if (error || !fournisseur) {
    notFound();
  }

  return (
    <div className="px-4 md:px-8 py-6 w-full">
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Modifier le Fournisseur</h1>
        <FournisseurForm initialData={fournisseur} />
      </div>
    </div>
  );
} 