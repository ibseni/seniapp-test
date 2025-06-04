"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Eye, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPurchaseOrders } from "@/app/serverActions/po/getPurchaseOrders";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { useSearchParams, useRouter } from "next/navigation";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface PurchaseOrder {
  id: string;
  numero_bon_commande: string;
  statut: string;
  total: number;
  date_creation: Date;
  date_modification: Date;
  status_envoi: boolean;
  demande_achat: {
    numero_demande_achat: string;
    projet: {
      numero_projet: string;
      nom: string;
    } | null;
    fournisseur: {
      numero_fournisseur: string;
      nom_fournisseur: string | null;
    } | null;
  };
}

export function PurchaseOrdersTable() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    numero: true,
    demande: true,
    projet: true,
    fournisseur: true,
    statut: true,
    status_envoi: true,
    total: true,
    date_creation: true,
    date_modification: true,
  });

  // Pagination
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define the default number of items per page
  const DEFAULT_ITEMS_PER_PAGE = 20;

  // Define query params
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) < 1 ? 1 : Number(searchParams.get("page"))
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    Number(searchParams.get("limit")) < 1
      ? DEFAULT_ITEMS_PER_PAGE
      : Number(searchParams.get("limit"))
  );
  const [filterValue, setFilterValue] = useState(
    (searchParams.get("search") as string) || ("" as string)
  );

  const [maxPages, setMaxPages] = useState<number>(0);

  useEffect(() => {
    const currentPage_ = () => {
      try {
        return Number(searchParams.get("page")) < 1
          ? 1
          : Number(searchParams.get("page"));
      } catch (error) {
        console.error("Wrong query param:", error);
        router.replace("/achats/po");
        return 1;
      }
    };
    const itemsPerPage_ = () => {
      try {
        return Number(searchParams.get("limit")) < 1
          ? DEFAULT_ITEMS_PER_PAGE
          : Number(searchParams.get("limit"));
      } catch (error) {
        console.error("Wrong query param:", error);
        router.replace("/achats/po");
        return DEFAULT_ITEMS_PER_PAGE;
      }
    };

    setIsSearching(true);

    // Set states
    setCurrentPage(currentPage_());
    setItemsPerPage(itemsPerPage_());

    async function fetchOrders() {
      try {
        const result = await getPurchaseOrders(
          currentPage_(),
          filterValue,
          itemsPerPage_()
        );
        if (result.success && result.data) {
          const maxPages_ = Math.ceil(result.totalItems / itemsPerPage);

          setMaxPages(maxPages_);
          const typedOrders = result.data.map((order) => ({
            id: order.id,
            numero_bon_commande: order.numero_bon_commande,
            statut: order.statut,
            status_envoi: order.status_envoi,
            total: Number(order.total),
            date_creation: new Date(order.date_creation),
            date_modification: new Date(order.date_modification),
            demande_achat: order.demande_achat,
          }));
          console.log("Typed order:", typedOrders[0]); // Debug log
          setOrders(typedOrders);

          // Check if current page is out of bounds
          if (currentPage > maxPages_) {
            setCurrentPage(maxPages_);
            router.replace(
              `/achats/po?search=${encodeURIComponent(
                filterValue
              )}&page=${maxPages_}&limit=${itemsPerPage}`
            );
          }

          console.log("Raw order data:", result.data[0]); // Debug log
        } else {
          setMaxPages(0);
          setCurrentPage(1);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }

    fetchOrders();
  }, [searchParams]);

  // OLD FILTER
  /*
  const filteredOrders = orders.filter((order) => {
    const searchStr = filterValue.toLowerCase();
    return (
      order.numero_bon_commande.toLowerCase().includes(searchStr) ||
      order.demande_achat.numero_demande_achat
        .toLowerCase()
        .includes(searchStr) ||
      order.demande_achat.projet?.numero_projet
        .toLowerCase()
        .includes(searchStr) ||
      false ||
      order.demande_achat.projet?.nom.toLowerCase().includes(searchStr) ||
      false ||
      order.demande_achat.fournisseur?.numero_fournisseur
        .toLowerCase()
        .includes(searchStr) ||
      false ||
      order.demande_achat.fournisseur?.nom_fournisseur
        ?.toLowerCase()
        .includes(searchStr) ||
      false ||
      order.statut.toLowerCase().includes(searchStr)
    );
  });
  */

  const MobileCard = ({ order }: { order: PurchaseOrder }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-medium">{order.numero_bon_commande}</div>
            <div className="text-sm text-muted-foreground">
              {order.demande_achat.numero_demande_achat}
            </div>
          </div>
          <Badge
            variant={
              order.statut === "Complété"
                ? "default"
                : order.statut === "Annulé"
                ? "destructive"
                : "secondary"
            }
          >
            {order.statut}
          </Badge>
        </div>

        <div className="space-y-2">
          {order.demande_achat.projet && (
            <div>
              <div className="text-sm font-medium">Projet</div>
              <div className="text-sm">
                {order.demande_achat.projet.numero_projet} -{" "}
                {order.demande_achat.projet.nom}
              </div>
            </div>
          )}

          {order.demande_achat.fournisseur && (
            <div>
              <div className="text-sm font-medium">Fournisseur</div>
              <div className="text-sm">
                {order.demande_achat.fournisseur.numero_fournisseur} -{" "}
                {order.demande_achat.fournisseur.nom_fournisseur}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium">Total</div>
            <div className="text-sm">
              {new Intl.NumberFormat("fr-CA", {
                style: "currency",
                currency: "CAD",
              }).format(order.total)}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Date de création</div>
            <div className="text-sm">{formatDate(order.date_creation)}</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link href={`/achats/po/${order.numero_bon_commande}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-row w-full gap-3">
          <Input
            placeholder="Filtrer les demandes..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full sm:max-w-sm"
            disabled={isSearching}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                filterValue !== searchParams.get("search")
              ) {
                setIsSearching(true);
                router.push(
                  `/achats/po?search=${encodeURIComponent(
                    filterValue
                  )}&page=1&limit=${itemsPerPage}`
                );
              } else if (
                e.key === "Backspace" &&
                !filterValue &&
                searchParams.get("search") !== null
              ) {
                setIsSearching(true);
                router.push(`/achats/po?page=1&limit=${itemsPerPage}`);
              }
            }}
          />
          <Button
            disabled={isSearching}
            onClick={() => {
              if (filterValue !== searchParams.get("search")) {
                setIsSearching(true);
                router.push(
                  `/achats/po?search=${encodeURIComponent(filterValue)}&page=1`
                );
              }
            }}
          >
            {isSearching ? "Chargement..." : "Rechercher"}
          </Button>
        </div>
        <Select
          defaultValue={String(itemsPerPage)}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            router.push(
              `/achats/po?search=${encodeURIComponent(
                filterValue
              )}&page=1&limit=${value}`
            );
          }}
        >
          <SelectTrigger className="w-[80px] h-[37px]">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="40">40</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={visibleColumns.numero}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, numero: checked })
              }
            >
              Numéro
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.demande}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, demande: checked })
              }
            >
              Demande d'achat
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.projet}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, projet: checked })
              }
            >
              Projet
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.fournisseur}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, fournisseur: checked })
              }
            >
              Fournisseur
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.statut}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, statut: checked })
              }
            >
              Statut
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.total}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, total: checked })
              }
            >
              Total
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.date_creation}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, date_creation: checked })
              }
            >
              Date de création
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.date_modification}
              onCheckedChange={(checked) =>
                setVisibleColumns({
                  ...visibleColumns,
                  date_modification: checked,
                })
              }
            >
              Dernière modification
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status_envoi}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, status_envoi: checked })
              }
            >
              Envoyé
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        {orders.map((order) => (
          <MobileCard key={order.id} order={order} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.numero && <TableHead>Numéro</TableHead>}
              {visibleColumns.demande && <TableHead>Demande d'achat</TableHead>}
              {visibleColumns.projet && <TableHead>Projet</TableHead>}
              {visibleColumns.fournisseur && <TableHead>Fournisseur</TableHead>}
              {visibleColumns.statut && <TableHead>Statut</TableHead>}
              {visibleColumns.total && <TableHead>Total</TableHead>}
              {visibleColumns.date_creation && (
                <TableHead>Date de création</TableHead>
              )}
              {visibleColumns.date_modification && (
                <TableHead>Dernière modification</TableHead>
              )}
              {visibleColumns.status_envoi && <TableHead>Envoyé</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                {visibleColumns.numero && (
                  <TableCell>{order.numero_bon_commande}</TableCell>
                )}
                {visibleColumns.demande && (
                  <TableCell>
                    {order.demande_achat.numero_demande_achat}
                  </TableCell>
                )}
                {visibleColumns.projet && (
                  <TableCell>
                    {order.demande_achat.projet ? (
                      <div>
                        <div>{order.demande_achat.projet.numero_projet}</div>
                        <div className="text-sm text-gray-500">
                          {order.demande_achat.projet.nom}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                {visibleColumns.fournisseur && (
                  <TableCell>
                    {order.demande_achat.fournisseur ? (
                      <div>
                        <div>
                          {order.demande_achat.fournisseur.numero_fournisseur}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.demande_achat.fournisseur.nom_fournisseur}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                {visibleColumns.statut && (
                  <TableCell>
                    <Badge
                      variant={
                        order.statut === "Complété"
                          ? "default"
                          : order.statut === "Annulé"
                          ? "destructive"
                          : order.statut === "En révision"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {order.statut}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.total && (
                  <TableCell>
                    {new Intl.NumberFormat("fr-CA", {
                      style: "currency",
                      currency: "CAD",
                    }).format(order.total)}
                  </TableCell>
                )}
                {visibleColumns.date_creation && (
                  <TableCell>{formatDate(order.date_creation)}</TableCell>
                )}
                {visibleColumns.date_modification && (
                  <TableCell>{formatDate(order.date_modification)}</TableCell>
                )}
                {visibleColumns.status_envoi && (
                  <TableCell>
                    <Badge
                      variant={
                        order.status_envoi === true
                          ? "default"
                          : order.status_envoi === false
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status_envoi ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <Link href={`/achats/po/${order.numero_bon_commande}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {orders.length ? (
        <div className="rounded-md border py-2">
          <Pagination>
            <PaginationContent>
              {currentPage == 1 ? (
                ""
              ) : (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/achats/po?search=${encodeURIComponent(
                      filterValue
                    )}&page=${currentPage - 1}&limit=${itemsPerPage}`}
                  />
                </PaginationItem>
              )}
              <PaginationItem hidden={currentPage <= 1}>
                <PaginationLink
                  href={`/achats/po?search=${encodeURIComponent(
                    filterValue
                  )}&page=${currentPage - 1}&limit=${itemsPerPage}`}
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {currentPage}
                </PaginationLink>
              </PaginationItem>
              {currentPage >= maxPages ? (
                ""
              ) : (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href={`/achats/po?search=${encodeURIComponent(
                        filterValue
                      )}&page=${currentPage + 1}&limit=${itemsPerPage}`}
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem hidden={currentPage >= maxPages - 2}>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem hidden={currentPage === maxPages - 1}>
                    <PaginationLink
                      href={`/achats/po?search=${encodeURIComponent(
                        filterValue
                      )}&page=${maxPages}&limit=${itemsPerPage}`}
                    >
                      {maxPages}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`/achats/po?search=${encodeURIComponent(
                        filterValue
                      )}&page=${currentPage + 1}&limit=${itemsPerPage}`}
                    />
                  </PaginationItem>
                </>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      ) : (
        <Label className="flex justify-center mt-6">
          Aucune demande d'achat trouvée
        </Label>
      )}
    </div>
  );
}
