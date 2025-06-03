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
import { getPurchaseRequests } from "@/app/serverActions/pr/getPurchaseRequests";
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
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { SelectValue } from "@radix-ui/react-select";

interface PurchaseRequest {
  id: string;
  numero_demande_achat: string;
  statut: string | null;
  date_creation: Date;
  date_modification: Date;
  id_projet: string | null;
  id_fournisseur: string | null;
  projet: {
    numero_projet: string;
    nom: string;
    charge_de_projet: string | null;
  } | null;
  fournisseur: {
    numero_fournisseur: string;
    nom_fournisseur: string | null;
  } | null;
  demandeur: string | null;
}

export function PurchaseRequestsTable() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPendingN1Only, setShowPendingN1Only] = useState(false);
  const [showPendingN2Only, setShowPendingN2Only] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    numero: true,
    projet: true,
    fournisseur: true,
    statut: true,
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
        router.replace("/achats/pr");
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
        router.replace("/achats/pr");
        return DEFAULT_ITEMS_PER_PAGE;
      }
    };

    setIsSearching(true);

    // Set states
    setCurrentPage(currentPage_());
    setItemsPerPage(itemsPerPage_());
    setShowPendingN2Only(filterValue.includes("N2"));
    setShowPendingN1Only(filterValue.includes("N1"));

    async function fetchRequests() {
      try {
        const { success, data, totalItems } = await getPurchaseRequests(
          currentPage_(),
          filterValue,
          itemsPerPage_()
        );
        if (success && data) {
          const maxPages_ = Math.ceil(totalItems / itemsPerPage);

          setMaxPages(maxPages_);
          setRequests(data);

          // Check if current page is out of bounds
          if (currentPage > maxPages_) {
            setCurrentPage(maxPages_);
            router.replace(
              `/achats/pr?search=${encodeURIComponent(
                filterValue
              )}&page=${maxPages_}&limit=${itemsPerPage}`
            );
          }
        } else {
          setMaxPages(0);
          setCurrentPage(1);
          setRequests([]);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    }

    fetchRequests();
  }, [searchParams]);

  // NEW FILTER
  useEffect(() => {
    const N = showPendingN1Only ? "N1" : showPendingN2Only ? "N2" : "";
    let newFilter;

    if (!filterValue) newFilter = N; // Add N if filter is empty
    else if (filterValue.includes("N1") || filterValue.includes("N2"))
      newFilter = filterValue.replace(
        filterValue.substring(filterValue.length - 2, filterValue.length),
        N
      );
    // Add N if filter is already N1 or N2
    else if (N && filterValue.includes(N))
      newFilter = filterValue; // Keep N if filter is already selected
    else newFilter = `${filterValue} ${N}`; // Add N if a filter is selected

    setFilterValue(newFilter.trim());
    if (searchParams.get("search") !== newFilter) {
      router.push(
        `/achats/pr?search=${encodeURIComponent(
          newFilter.trim()
        )}&page=1&limit=${itemsPerPage}`
      );
    }
  }, [showPendingN1Only, showPendingN2Only]);

  // OLD FILTER
  /*
  const filteredRequests = useMemo(() => {
    const baseRequests = requests.filter((request) => {
      const searchStr = filterValue.toLowerCase();
      return (
        request.numero_demande_achat.toLowerCase().includes(searchStr) || X
        request.projet?.numero_projet.toLowerCase().includes(searchStr) ||
        false ||
        request.projet?.nom.toLowerCase().includes(searchStr) ||
        false ||
        request.fournisseur?.numero_fournisseur
          .toLowerCase()
          .includes(searchStr) ||
        false ||
        request.fournisseur?.nom_fournisseur
          ?.toLowerCase()
          .includes(searchStr) ||
        false ||
        request.statut?.toLowerCase().includes(searchStr) ||
        false
      );
    });

    if (showPendingN2Only) {
      return baseRequests.filter(
        (request) => request.statut === "En Attente N2"
      );
    }

    if (showPendingOnly && userEmail) {
      return baseRequests.filter(
        (request) =>
          request.statut === "En Attente N1" &&
          (request.projet?.charge_de_projet === userEmail ||
            request.demandeur === userEmail)
      );
    }

    return baseRequests;
  }, [requests, showPendingOnly, showPendingN2Only, filterValue, userEmail]);
  */

  const MobileCard = ({ request }: { request: PurchaseRequest }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{request.numero_demande_achat}</div>
              <Badge
                variant={
                  request.statut === "Approuvé"
                    ? "default"
                    : request.statut === "Rejeté"
                    ? "destructive"
                    : "secondary"
                }
                className="mt-1"
              >
                {request.statut}
              </Badge>
            </div>
            <Link href={`/achats/pr/${request.numero_demande_achat}`}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {request.projet && (
            <div>
              <div className="text-sm text-muted-foreground">Projet</div>
              <div className="font-medium">{request.projet.numero_projet}</div>
              <div className="text-sm text-muted-foreground">
                {request.projet.nom}
              </div>
            </div>
          )}

          {request.fournisseur && (
            <div>
              <div className="text-sm text-muted-foreground">Fournisseur</div>
              <div className="font-medium">
                {request.fournisseur.numero_fournisseur}
              </div>
              <div className="text-sm text-muted-foreground">
                {request.fournisseur.nom_fournisseur}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Créé le {formatDate(request.date_creation)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant={showPendingN1Only ? "default" : "outline"}
          onClick={() => {
            setShowPendingN1Only((pending) => !pending);
            setShowPendingN2Only(false);
          }}
          className="mb-4"
        >
          {showPendingN1Only
            ? "Afficher tout"
            : "Afficher les demandes en attente N1"}
        </Button>
        <Button
          variant={showPendingN2Only ? "default" : "outline"}
          onClick={() => {
            setShowPendingN2Only((pending) => !pending);
            setShowPendingN1Only(false);
          }}
          className="mb-4"
        >
          {showPendingN2Only
            ? "Afficher tout"
            : "Afficher les demandes en attente N2"}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                  `/achats/pr?search=${encodeURIComponent(
                    filterValue
                  )}&page=1&limit=${itemsPerPage}`
                );
              } else if (
                e.key === "Backspace" &&
                !filterValue &&
                searchParams.get("search") !== null
              ) {
                setIsSearching(true);
                router.push(`/achats/pr?page=1&limit=${itemsPerPage}`);
              }
            }}
          />
          <Button
            disabled={isSearching}
            onClick={() => {
              if (filterValue !== searchParams.get("search")) {
                setIsSearching(true);
                router.push(
                  `/achats/pr?search=${encodeURIComponent(filterValue)}&page=1`
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
              `/achats/pr?search=${encodeURIComponent(
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
            <Button variant="outline" size="sm">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {requests.map((request) => (
          <MobileCard key={request.id} request={request} />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.numero && <TableHead>Numéro</TableHead>}
                {visibleColumns.projet && <TableHead>Projet</TableHead>}
                {visibleColumns.fournisseur && (
                  <TableHead>Fournisseur</TableHead>
                )}
                {visibleColumns.statut && <TableHead>Statut</TableHead>}
                {visibleColumns.date_creation && (
                  <TableHead>Date de création</TableHead>
                )}
                {visibleColumns.date_modification && (
                  <TableHead className="hidden lg:table-cell">
                    Dernière modification
                  </TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  {visibleColumns.numero && (
                    <TableCell className="font-medium">
                      {request.numero_demande_achat}
                    </TableCell>
                  )}
                  {visibleColumns.projet && (
                    <TableCell>
                      {request.projet ? (
                        <div>
                          <div className="font-medium">
                            {request.projet.numero_projet}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.projet.nom}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.fournisseur && (
                    <TableCell>
                      {request.fournisseur ? (
                        <div>
                          <div className="font-medium">
                            {request.fournisseur.numero_fournisseur}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.fournisseur.nom_fournisseur}
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
                          request.statut === "Approuvé"
                            ? "default"
                            : request.statut === "Rejeté"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {request.statut}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.date_creation && (
                    <TableCell>{formatDate(request.date_creation)}</TableCell>
                  )}
                  {visibleColumns.date_modification && (
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(request.date_modification)}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Link href={`/achats/pr/${request.numero_demande_achat}`}>
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
        {requests.length ? (
          <div className="rounded-md border py-2">
            <Pagination>
              <PaginationContent>
                {currentPage == 1 ? (
                  ""
                ) : (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/achats/pr?search=${encodeURIComponent(
                        filterValue
                      )}&page=${currentPage - 1}&limit=${itemsPerPage}`}
                    />
                  </PaginationItem>
                )}
                <PaginationItem hidden={currentPage <= 1}>
                  <PaginationLink
                    href={`/achats/pr?search=${encodeURIComponent(
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
                        href={`/achats/pr?search=${encodeURIComponent(
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
                        href={`/achats/pr?search=${encodeURIComponent(
                          filterValue
                        )}&page=${maxPages}&limit=${itemsPerPage}`}
                      >
                        {maxPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href={`/achats/pr?search=${encodeURIComponent(
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
    </div>
  );
}
