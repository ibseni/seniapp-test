"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Decimal } from "@prisma/client/runtime/library";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { updatePOStatus } from "@/app/serverActions/po/updatePOStatus";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PODetailsModal } from "@/components/po/PODetailsModal";
import { getPurchaseOrder2 } from "@/app/serverActions/po/getPurchaseOrder2";

interface POLine {
  bon_commande: {
    numero_bon_commande: string;
    date_creation: Date;
    demande_achat: {
      fournisseur: {
        numero_fournisseur: string;
      } | null;
      projet: {
        numero_projet: string;
      } | null;
    };
  };
  ligne_demande: {
    activite: {
      numero_activite: string;
    } | null;
  } | null;
  prix_unitaire: number;
  quantite: number;
}

interface AvantageClientProps {
  initialData: POLine[];
  userEmail: string;
}

export default function AvantageClient({ initialData, userEmail }: AvantageClientProps) {
  const router = useRouter();

  // Get available weeks from the data
  const weeks = Array.from(new Set(initialData.map(line => {
    const date = new Date(line.bon_commande.date_creation);
    date.setHours(0, 0, 0, 0);
    // Get Monday of the week
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    return monday.toISOString().split('T')[0];
  }))).sort().reverse();

  const [selectedWeek, setSelectedWeek] = useState(weeks[0] || '');
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort data by selected week
  const filteredData = initialData
    .filter(line => {
      const date = new Date(line.bon_commande.date_creation);
      date.setHours(0, 0, 0, 0);
      // Get Monday of the week
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      return monday.toISOString().split('T')[0] === selectedWeek;
    })
    .sort((a, b) => {
      // Extract numeric parts from PO numbers (assuming format PO-XXX-XXX)
      const aNum = a.bon_commande.numero_bon_commande.split('-').slice(1).join('');
      const bNum = b.bon_commande.numero_bon_commande.split('-').slice(1).join('');
      return parseInt(aNum) - parseInt(bNum);
    });

  // Initialize with all lines selected when week changes
  useEffect(() => {
    const allIndexes = new Set(Array.from({ length: filteredData.length }, (_, i) => i));
    setSelectedLines(allIndexes);
  }, [selectedWeek]); // Only re-run when selectedWeek changes

  const toggleAll = () => {
    if (selectedLines.size === filteredData.length) {
      setSelectedLines(new Set());
    } else {
      const allIndexes = new Set(Array.from({ length: filteredData.length }, (_, i) => i));
      setSelectedLines(allIndexes);
    }
  };

  const toggleLine = (index: number) => {
    const newSelected = new Set(selectedLines);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLines(newSelected);
  };

  const handleDownload = () => {
    // Get selected lines with their request numbers // to trigger build ----- 3
       console.log(selectedLines); // Get selected lines with their request numbers // to trigger build ----- 3

    const selectedData = filteredData
      .map((line, index) => {
        if (!selectedLines.has(index)) return null;
        
        const requestNumber = `RQ${String(Array.from(selectedLines).filter(i => i <= index).length).padStart(2, '0')}`;
        const date = new Date(line.bon_commande.date_creation);
        const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        const poNumber = line.bon_commande.numero_bon_commande.replace('PO-', '').replace('-', '');
        const supplierNumber = line.bon_commande.demande_achat.fournisseur?.numero_fournisseur || '';
        const activityNumber = line.ligne_demande?.activite?.numero_activite || '';
        const projectNumber = line.bon_commande.demande_achat.projet?.numero_projet || '';
        
        return `${requestNumber},W09,01,3,${formattedDate},,COMNO="${poNumber}",COMFRN="${supplierNumber}",COMACT="${activityNumber}",COMCNT="${projectNumber}",COMQTE="${(line.prix_unitaire * line.quantite).toFixed(2)}"`;
      })
      .filter(Boolean)
      .join('\r\n');

    // Create and download the file with Windows line endings
    const blob = new Blob([selectedData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avantage_export_${selectedWeek}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleUpdateStatus = async () => {
    const selectedPOs = filteredData
      .filter((_, index) => selectedLines.has(index))
      .map(line => line.bon_commande.numero_bon_commande);

    const result = await updatePOStatus(selectedPOs, userEmail);
    
    if (result.success) {
      toast.success("Statut mis à jour avec succès");
      // Refresh the server component data
      router.refresh();
      // Clear selection after successful update
      setSelectedLines(new Set());
    } else {
      toast.error("Échec de la mise à jour du statut");
    }
  };

  const handlePOClick = async (numero_bon_commande: string) => {
    setIsLoading(true);
    setIsModalOpen(true);
    
    try {
      const result = await getPurchaseOrder2(numero_bon_commande);
      if (result.success && result.data) {
        setSelectedPO(result.data);
      }
    } catch (error) {
      console.error("Error fetching PO details:", error);
      toast.error("Erreur lors du chargement des détails du bon de commande");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Integration Avantage</h1>
          <Button 
            onClick={handleDownload}
            disabled={selectedLines.size === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
          <Button 
            onClick={handleUpdateStatus}
            disabled={selectedLines.size === 0}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Marquer comme importé
          </Button>
        </div>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Sélectionner une semaine" />
          </SelectTrigger>
          <SelectContent>
            {weeks.map(week => (
              <SelectItem key={week} value={week}>
                Semaine du {new Date(week).toLocaleDateString('fr-CA')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No. Requête</TableHead>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedLines.size === filteredData.length && filteredData.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier Number</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Project Number</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((line, index) => {
              // Calculate request number if line is selected
              const requestNumber = selectedLines.has(index) 
                ? `RQ${String(Array.from(selectedLines).filter(i => i <= index).length).padStart(2, '0')}`
                : '';

              return (
                <TableRow key={index}>
                  <TableCell>{requestNumber}</TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={selectedLines.has(index)}
                      onCheckedChange={() => toggleLine(index)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handlePOClick(line.bon_commande.numero_bon_commande)}
                      className="text-blue-600 hover:underline"
                    >
                      {line.bon_commande.numero_bon_commande}
                    </button>
                  </TableCell>
                  <TableCell>{new Date(line.bon_commande.date_creation).toLocaleDateString('fr-CA')}</TableCell>
                  <TableCell>{line.bon_commande.demande_achat.fournisseur?.numero_fournisseur || '-'}</TableCell>
                  <TableCell>{line.ligne_demande?.activite?.numero_activite || '-'}</TableCell>
                  <TableCell>{line.bon_commande.demande_achat.projet?.numero_projet || '-'}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(line.prix_unitaire) * line.quantite)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PODetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPO(null);
        }}
        poDetails={selectedPO}
        isLoading={isLoading}
      />
    </div>
  );
} 