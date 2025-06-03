import { FournisseurForm } from "@/components/fournisseurs/FournisseurForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function NewFournisseurPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canCreate = permissions.includes('suppliers:create');

    if (!canCreate) {
        redirect("/unauthorized");
    }

    return (
        <div className="px-4 md:px-6 py-6 w-full">
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Fournisseur</h1>
                <h4 className="text-xl font-bold tracking-tight bg-red-400">Ces champs doivent concorder avec les donnees de Avantage</h4>
                <h4 className="text-xl font-bold tracking-tight bg-red-400">Surtout le numéro de FOURNISSEUR</h4>
                <FournisseurForm />
            </div>
        </div>
    );
} 