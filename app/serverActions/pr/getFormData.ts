import { db } from "@/src/lib/prisma";

export async function getFormData() {
  try {
    const [projects, suppliers, activities] = await Promise.all([
      db.projets.findMany({
        select: {
          id: true,
          numero_projet: true,
          nom: true,
        },
        orderBy: {
          numero_projet: "asc",
        },
      }),
      db.fournisseurs.findMany({
        select: {
          id: true,
          numero_fournisseur: true,
          nom_fournisseur: true,
        },
        orderBy: {
          numero_fournisseur: "asc",
        },
      }),
      db.activites.findMany({
        where: {
          valid: true,
          NOT: {
            numero_activite: {
              in: ['00000', '99999']
            }
          }
        },
        orderBy: {
          numero_activite: "asc",
        },
      }),
    ]);

    return {
      success: true as const,
      data: {
        projects,
        suppliers,
        activities,
      },
    };
  } catch (error) {
    console.error("Failed to fetch form data:", error);
    return {
      success: false as const,
      error: "Failed to fetch form data",
    };
  }
} 