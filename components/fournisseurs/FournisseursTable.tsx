"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { deleteFournisseur } from "@/app/serverActions/fournisseurs/deleteFournisseur";

interface Fournisseur {
  id: string;
  numero_fournisseur: string;
  nom_fournisseur: string | null;
  adresse_ligne1: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone1: string | null;
  poste_telephone1?: string | null;
  telephone2?: string | null;
  telecopieur?: string | null;
  telephone_autre?: string | null;
  nom_responsable: string | null;
}

type SortConfig = {
  key: keyof Fournisseur | null;
  direction: 'asc' | 'desc';
};

type Column = {
  key: keyof Fournisseur;
  label: string;
  visible: boolean;
};

interface FournisseursTableProps {
  data: Fournisseur[];
  canDelete?: boolean;
}

export function FournisseursTable({ data, canDelete = false }: FournisseursTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: null,
    direction: 'asc'
  });
  const [filterValue, setFilterValue] = React.useState("");
  const [columns, setColumns] = React.useState<Column[]>([
    { key: 'numero_fournisseur', label: 'Numéro', visible: true },
    { key: 'nom_fournisseur', label: 'Nom', visible: true },
    { key: 'adresse_ligne1', label: 'Adresse', visible: true },
    { key: 'ville', label: 'Ville', visible: true },
    { key: 'code_postal', label: 'Code Postal', visible: true },
    { key: 'telephone1', label: 'Téléphone', visible: true },
    { key: 'poste_telephone1', label: 'Poste', visible: false },
    { key: 'telephone2', label: 'Téléphone 2', visible: false },
    { key: 'telecopieur', label: 'Télécopieur', visible: false },
    { key: 'telephone_autre', label: 'Autre Tél.', visible: false },
    { key: 'nom_responsable', label: 'Responsable', visible: true },
  ]);

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur?")) {
      await deleteFournisseur(id);
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() => {
    if (!filterValue) return sortedData;
    const searchTerm = filterValue.toLowerCase();
    return sortedData.filter(fournisseur => {
      return columns.some(column => {
        const value = fournisseur[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });
  }, [sortedData, filterValue, columns]);

  const requestSort = (key: keyof Fournisseur) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Rechercher..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Colonnes</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={column.visible}
                onCheckedChange={(checked) => {
                  setColumns(
                    columns.map((col) =>
                      col.key === column.key ? { ...col, visible: checked } : col
                    )
                  );
                }}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter((column) => column.visible)
                .map((column) => (
                  <TableHead
                    key={column.key}
                    className="whitespace-nowrap"
                    onClick={() => requestSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortConfig?.key === column.key && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((fournisseur) => (
                <TableRow key={fournisseur.id}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.key}>
                      {fournisseur[column.key] || '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/achats/fournisseurs/${fournisseur.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {canDelete && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(fournisseur.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                  Aucun fournisseur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end px-2 mt-4">
        <div className="text-sm text-muted-foreground">
          {filteredData.length} fournisseur(s) trouvé(s)
        </div>
      </div>
    </div>
  );
} 