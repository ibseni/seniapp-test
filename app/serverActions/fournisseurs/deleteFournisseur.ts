"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteFournisseur(id: string) {
  try {
    await db.fournisseurs.delete({
      where: { id },
    });

    revalidatePath("/fournisseurs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Failed to delete supplier" };
  }
} 