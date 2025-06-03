"use client";

import { Button } from "@/components/ui/button";
import { generatePurchaseOrderPDF } from "@/app/serverActions/po/generatePDF";
import { useState } from "react";

const downloadPDF = async (numero_bon_commande: string) => {
  try {
    const response = await fetch(`/api/pdf/${numero_bon_commande}`);
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `${numero_bon_commande}.pdf`;

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};

interface DownloadPDFButtonProps {
  numero_bon_commande: string;
}

export function DownloadPDFButton({ numero_bon_commande }: DownloadPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      // First generate the PDF
      await generatePurchaseOrderPDF(numero_bon_commande);
      // Then trigger the download
      await downloadPDF(numero_bon_commande);
    } catch (error) {
      console.error('Error generating or downloading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
      className="h-[50px]"
    >
      {isLoading ? "Generation en cours..." : "Télécharger PDF"}
    </Button>
  );
} 