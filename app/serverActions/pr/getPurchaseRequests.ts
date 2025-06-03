"use server";

import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";

// Define the default number of items per page
const DEFAULT_ITEMS_PER_PAGE = 20;

export async function getPurchaseRequests(
  currentPage: number,
  searchTerm?: string,
  limit?: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Array of search terms
    let filterArray;
    if (searchTerm) {
      filterArray = searchTerm.trim().split(" ");
    }

    // NEW FILTER
    const count = await db.demandes_achat.count({
      where:
        searchTerm && filterArray
          ? {
              AND: [
                {
                  OR: !(filterArray[0] == "N1" || filterArray[0] == "N2")
                    ? filterArray.flatMap((term) => [
                        {
                          numero_demande_achat: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                        {
                          projet: {
                            is: {
                              numero_projet: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          projet: {
                            is: {
                              nom: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          fournisseur: {
                            is: {
                              numero_fournisseur: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          fournisseur: {
                            is: {
                              nom_fournisseur: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        /*
                    {
                      statut: {
                        contains: term,
                        mode: "insensitive",
                      },
                    },*/
                      ])
                    : [],
                },
                {
                  statut:
                    filterArray[filterArray.length - 1] == "N1" ||
                    filterArray[filterArray.length - 1] == "N2"
                      ? {
                          contains: filterArray[filterArray.length - 1],
                          mode: "insensitive",
                        }
                      : {},
                },
              ],
            }
          : {},
    });

    // Check if current page is out of bounds and serve last page
    if (count == 0) currentPage = 1;
    else if (
      currentPage > Math.ceil(count / (limit || DEFAULT_ITEMS_PER_PAGE))
    ) {
      currentPage = Math.ceil(count / (limit || DEFAULT_ITEMS_PER_PAGE));
    }

    // Get purchase requests
    const requests = await db.demandes_achat.findMany({
      where:
        searchTerm && filterArray
          ? {
              AND: [
                {
                  OR: !(filterArray[0] == "N1" || filterArray[0] == "N2")
                    ? filterArray.flatMap((term) => [
                        {
                          numero_demande_achat: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                        {
                          projet: {
                            is: {
                              numero_projet: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          projet: {
                            is: {
                              nom: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          fournisseur: {
                            is: {
                              numero_fournisseur: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        {
                          fournisseur: {
                            is: {
                              nom_fournisseur: {
                                contains: term,
                                mode: "insensitive",
                              },
                            },
                          },
                        },
                        /*
                    {
                      statut: {
                        contains: term,
                        mode: "insensitive",
                      },
                    },*/
                      ])
                    : [],
                },
                {
                  statut:
                    filterArray[filterArray.length - 1] == "N1" ||
                    filterArray[filterArray.length - 1] == "N2"
                      ? {
                          contains: filterArray[filterArray.length - 1],
                          mode: "insensitive",
                        }
                      : {},
                },
              ],
            }
          : {},
      take: limit || DEFAULT_ITEMS_PER_PAGE,
      skip: (limit || DEFAULT_ITEMS_PER_PAGE) * (currentPage - 1),
      include: {
        projet: {
          select: {
            numero_projet: true,
            nom: true,
            charge_de_projet: true,
          },
        },
        fournisseur: {
          select: {
            numero_fournisseur: true,
            nom_fournisseur: true,
          },
        },
      },
      orderBy: {
        numero_demande_achat: "desc",
      },
    });

    console.log(
      "Current Page:",
      currentPage,
      "Requests sent:",
      requests.length,
      "Total Items:",
      count,
      "Limit:",
      limit,
      "Max Pages:",
      Math.ceil(count / (limit || DEFAULT_ITEMS_PER_PAGE))
    );

    //console.log('First request from DB:', requests[0]); // Debug log
    return {
      success: true,
      data: requests,
      totalItems: count,
    };
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    return { success: false, error: "Failed to fetch purchase requests" };
  }
}
