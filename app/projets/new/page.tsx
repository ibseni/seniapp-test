import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  const cookieStore = cookies();
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  if (!permissions.includes('projects:create')) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nouveau Projet</h2>
        <p className="text-muted-foreground">
          Créez un nouveau projet
        </p>
      </div>
      <NewProjectForm />
    </div>
  );
} 