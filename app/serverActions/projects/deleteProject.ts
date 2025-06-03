"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProject(id: string) {
  try {
    await db.projets.delete({
      where: { id },
    });

    revalidatePath("/projets");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
} 