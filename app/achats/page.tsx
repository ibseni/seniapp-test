import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPurchaseRequests } from "@/app/serverActions/pr/getUserPurchaseRequests";
import { getUserPurchaseOrders } from "@/app/serverActions/po/getUserPurchaseOrders";
import { UserRequestsOverview } from "@/components/achats/UserRequestsOverview";

export default async function AchatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's PRs and POs
  const [prResult, poResult] = await Promise.all([
    getUserPurchaseRequests(),
    getUserPurchaseOrders(),
  ]);

  const purchaseRequests = prResult.success ? prResult.data : [];
  const purchaseOrders = poResult.success ? poResult.data : [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Achats
        </h1>
        <UserRequestsOverview 
          purchaseRequests={purchaseRequests || []}
          purchaseOrders={purchaseOrders || []}
        />
      </div>
    </div>
  );
} 