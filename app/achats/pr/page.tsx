import { PurchaseRequestsTable } from "@/components/pr/PurchaseRequestsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function PurchaseRequestsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canCreate = permissions.includes('create:pr'); // ?

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Demandes d'achat</h2>
        { true && (
          <Link href="/achats/pr/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau
            </Button>
          </Link>
        )}
      </div>
      <PurchaseRequestsTable />
    </div>
  );
}
