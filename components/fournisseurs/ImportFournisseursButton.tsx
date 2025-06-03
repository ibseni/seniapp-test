"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { importFournisseurs } from "@/app/serverActions/fournisseurs/importFournisseurs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportFournisseursButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      setImportResult({
        success: false,
        message: "Le fichier doit être au format CSV",
      });
      setIsDialogOpen(true);
      return;
    }

    try {
      // Read file as array buffer to handle ANSI encoding
      const buffer = await file.arrayBuffer();
      // Use Windows-1252 (ANSI) decoder
      const decoder = new TextDecoder('windows-1252');
      const content = decoder.decode(buffer);

      const result = await importFournisseurs(content);

      if (result.success && result.data) {
        const { imported, updated } = result.data;
        const importMessage = [];
        if (imported > 0) {
          importMessage.push(`${imported} nouveau(x) fournisseur(s) importé(s)`);
        }
        if (updated > 0) {
          importMessage.push(`${updated} fournisseur(s) mis à jour`);
        }
        
        setImportResult({
          success: true,
          message: importMessage.join(' et '),
          details: result.validationErrors,
        });
        router.refresh();
      } else {
        setImportResult({
          success: false,
          message: result.error || "Erreur lors de l'importation",
          details: result.validationErrors,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: "Erreur lors de l'importation",
      });
    }

    setIsDialogOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Importer CSV
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résultat de l'importation</DialogTitle>
          </DialogHeader>
          <Alert variant={importResult?.success ? "default" : "destructive"}>
            {importResult?.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult?.success ? "Succès" : "Erreur"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {importResult?.message}
              {importResult?.details && importResult.details.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {importResult.details.map((detail, index) => (
                    <li key={index} className="text-sm">
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    </>
  );
} 