"use server";

import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { redirect } from "next/navigation";

// Define the number of items per page
const DEFAULT_ITEMS_PER_PAGE = 20;

export async function getPurchaseOrders(
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

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes("po:read");

    if (!canRead) {
      return { success: false, error: "Unauthorized" };
    }

    // Check number of items
    const itemsTotalNumber = await db.bons_commande.count();
    const maxPages = Math.ceil(itemsTotalNumber / DEFAULT_ITEMS_PER_PAGE);

    // Array of search terms
    let filterArray;
    if (searchTerm) {
      filterArray = searchTerm.trim().split(" ");
    }

    // NEW FILTER
    const count = await db.bons_commande.count({
      where:
        searchTerm && filterArray
          ? {
              OR: filterArray.flatMap((term) => [
                {
                  numero_bon_commande: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
                {
                  demande_achat: {
                    is: {
                      numero_demande_achat: {
                        contains: term,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      projet: {
                        is: {
                          numero_projet: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      projet: {
                        is: {
                          nom: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      fournisseur: {
                        is: {
                          numero_fournisseur: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      fournisseur: {
                        is: {
                          nom_fournisseur: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  statut: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              ]),
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

    const orders = await db.bons_commande.findMany({
      where:
        searchTerm && filterArray
          ? {
              OR: filterArray.flatMap((term) => [
                {
                  numero_bon_commande: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
                {
                  demande_achat: {
                    is: {
                      numero_demande_achat: {
                        contains: term,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      projet: {
                        is: {
                          numero_projet: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      projet: {
                        is: {
                          nom: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      fournisseur: {
                        is: {
                          numero_fournisseur: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  demande_achat: {
                    is: {
                      fournisseur: {
                        is: {
                          nom_fournisseur: {
                            contains: term,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  statut: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              ]),
            }
          : {},
      take: limit || DEFAULT_ITEMS_PER_PAGE,
      skip: (limit || DEFAULT_ITEMS_PER_PAGE) * (currentPage - 1),
      select: {
        id: true,
        numero_bon_commande: true,
        statut: true,
        status_envoi: true,
        total: true,
        date_creation: true,
        date_modification: true,
        demande_achat: {
          select: {
            numero_demande_achat: true,
            projet: {
              select: {
                numero_projet: true,
                nom: true,
              },
            },
            fournisseur: {
              select: {
                numero_fournisseur: true,
                nom_fournisseur: true,
              },
            },
          },
        },
      },
      orderBy: {
        numero_bon_commande: "desc",
      },
    });

    // Convert Decimal values to numbers in the response
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: order.total ? Number(order.total) : null,
    }));

    console.log("First order from DB:", formattedOrders[0]); // Debug log

    return {
      success: true,
      data: formattedOrders,
      totalItems: count,
    };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return { success: false, error: "Failed to fetch purchase orders" };
  }
}
