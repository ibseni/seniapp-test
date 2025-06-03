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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  numero_projet: string;
  nom: string;
  addresse: string;
  addresseLivraison: string | null;
  id_dossier_commande: string | null;
  surintendant: string | null;
  coordonateur_projet: string | null;
  charge_de_projet: string | null;
  directeur_de_projet: string | null;
}

type SortConfig = {
  key: keyof Project | null;
  direction: 'asc' | 'desc';
};

type Column = {
  key: keyof Project;
  label: string;
  visible: boolean;
};

export function ProjectsTable({ data }: { data: Project[] }) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: null,
    direction: 'asc'
  });
  const [filterValue, setFilterValue] = React.useState("");
  const [columns, setColumns] = React.useState<Column[]>([
    { key: 'numero_projet', label: 'Numéro', visible: true },
    { key: 'nom', label: 'Nom', visible: true },
    { key: 'addresse', label: 'Adresse', visible: false },
    { key: 'addresseLivraison', label: 'Adresse de livraison', visible: false },
    { key: 'surintendant', label: 'Surintendant', visible: true },
    { key: 'coordonateur_projet', label: 'Coordonateur', visible: false },
    { key: 'charge_de_projet', label: 'Chargé de projet', visible: false },
    { key: 'directeur_de_projet', label: 'Directeur', visible: false },
  ]);

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
    return sortedData.filter(project => {
      return columns.some(column => {
        const value = project[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });
  }, [sortedData, filterValue, columns]);

  const requestSort = (key: keyof Project) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleColumn = (columnKey: keyof Project) => {
    setColumns(current =>
      current.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filtrer les projets..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Colonnes
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={column.visible}
                onCheckedChange={() => toggleColumn(column.key)}
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
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort(column.key)}
                    className="h-8 px-2 py-1 hover:bg-transparent font-medium"
                  >
                    {column.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((project) => (
                <TableRow 
                  key={project.id}
                  className="hover:bg-muted/50"
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={column.key}>
                      {column.key === 'numero_projet' ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{project.numero_projet}</span>
                          <span className="text-sm text-muted-foreground">{project.nom}</span>
                        </div>
                      ) : (
                        project[column.key] || '-'
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/projets/${project.numero_projet}`)}>
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/projets/${project.numero_projet}/edit`)}>
                          Modifier le projet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                  Aucun projet trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end px-2">
        <div className="text-sm text-muted-foreground">
          {filteredData.length} projet(s) trouvé(s)
        </div>
      </div>
    </div>
  );
} 