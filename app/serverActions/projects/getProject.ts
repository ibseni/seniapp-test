"use server";

import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

export async function getProjects() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes('projects:read');

    if (!canRead) {
      return { success: false, error: "Unauthorized" };
    }

    const projects = await db.projets.findMany({
      orderBy: {
        numero_projet: 'desc',
      },
    });

    return { success: true, data: projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function getProject(numero_projet: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes('projects:read');

    if (!canRead) {
      return { success: false, error: "Unauthorized" };
    }

    const project = await db.projets.findUnique({
      where: { numero_projet }
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return { success: true, data: project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, error: "Failed to fetch project" };
  }
} 