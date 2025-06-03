import { PurchaseRequestForm } from "@/components/pr/PurchaseRequestForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getFormData } from "@/app/serverActions/pr/getFormData";

export default async function NewPurchaseRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { success, data, error } = await getFormData();

  if (!success || !data) {
    throw new Error(error || "Failed to load form data");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Nouvelle demande d&apos;achat
        </h1>
        <PurchaseRequestForm
          projects={data.projects}
          suppliers={data.suppliers}
          activities={data.activities}
          user={{ email: user.email || "" }}
        />
      </div>
    </div>
  );
} 