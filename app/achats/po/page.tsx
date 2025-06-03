import { PurchaseOrdersTable } from "@/components/po/PurchaseOrdersTable";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function PurchaseOrdersPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canRead = permissions.includes('po:read');

  if (!canRead) {
    redirect("/unauthorized");
  }

  return (
    <div className="mx-8 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bons de commande</h1>
      </div>
      <PurchaseOrdersTable />
    </div>
  );
}
