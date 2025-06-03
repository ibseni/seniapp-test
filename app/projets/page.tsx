import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { getProjects } from "@/app/serverActions/projects/getProject";
import { ProjectsClientPage } from "@/components/projects/ProjectsClientPage";

export default async function ProjectsPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check permissions
  const permissions = await getUserPermissionsServer(user.id);
  const canRead = permissions.includes('projects:read');
  const canCreate = permissions.includes('projects:create');

  if (!canRead) {
    redirect("/unauthorized");
  }

  // Get projects
  const { success, data: projects, error: projectsError } = await getProjects();

  if (!success || !projects) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading projects
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ProjectsClientPage projects={projects} canCreate={canCreate} />;
} 