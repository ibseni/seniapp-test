import { EditProjectForm } from "@/components/projects/EditProjectForm";
import { getProject } from "@/app/serverActions/projects/getProject";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ numero_projet: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canUpdate = permissions.includes('projects:update');

  if (!canUpdate) {
    redirect("/unauthorized");
  }

  const { success, data: project, error } = await getProject(resolvedParams.numero_projet);

  if (!success || !project) {
    notFound();
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-[1400px] w-full mx-auto">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier le projet {project.numero_projet}
        </h1>
        <EditProjectForm project={project} />
      </div>
    </div>
  );
} 