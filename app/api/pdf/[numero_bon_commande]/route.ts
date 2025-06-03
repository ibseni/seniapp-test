import { generatePurchaseOrderPDF, getPDF } from "@/app/serverActions/po/generatePDF";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/src/lib/prisma";

function sanitizeFilename(str: string) {
  // Replace spaces and dots with underscores, but keep accented characters
  return str.trim().replace(/[\s.]+/g, ' ');
}

function encodeRFC5987ValueChars(str: string) {
  return encodeURIComponent(str)
    // Note that although RFC3986 reserves "!", RFC5987 does not
    .replace(/['()]/g, escape) // i.e., %27 %28 %29
    .replace(/\*/g, '%2A')
    // The following are not required for percent-encoding per RFC5987
    .replace(/%(?:7C|60|5E)/g, unescape);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numero_bon_commande: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get PO details for filename
    const po = await db.bons_commande.findUnique({
      where: { numero_bon_commande: resolvedParams.numero_bon_commande },
      include: {
        demande_achat: {
          include: {
            projet: true,
            fournisseur: true,
          },
        },
      },
    });

    if (!po) {
      return new Response('Purchase order not found', { status: 404 });
    }

    // First ensure the PDF is generated
    await generatePurchaseOrderPDF(resolvedParams.numero_bon_commande);
    
    // Then get the PDF data
    const pdfData = await getPDF(resolvedParams.numero_bon_commande);

    // Create filename with project number, supplier name, and PO number
    const projectNumber = po.demande_achat.projet?.numero_projet || 'NO-PROJECT';
    const supplierName = sanitizeFilename(po.demande_achat.fournisseur?.nom_fournisseur || 'NO-SUPPLIER');
    const poNumber = resolvedParams.numero_bon_commande;
    
    // Format filename with hyphens
    const filename = `${projectNumber}-${supplierName}-${poNumber}.pdf`;
    
    // Provide both ASCII and UTF-8 filenames for maximum compatibility
    const asciiFilename = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const encodedUtf8Filename = encodeRFC5987ValueChars(filename);
    
    // Return as downloadable PDF with properly encoded filename
    return new Response(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedUtf8Filename}`,
        'Content-Length': pdfData.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return new Response('Error serving PDF', { status: 500 });
  }
} 