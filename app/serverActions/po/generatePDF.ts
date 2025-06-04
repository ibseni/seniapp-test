"use server";

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib';
import { db } from "@/src/lib/prisma";
import { formatDate } from "@/utils/format";
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { bons_commande, demandes_achat } from '@prisma/client';
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";

type DeliveryOption = "pickup" | "siege_social" | "projet";
type TypeLivraison = "Boomtruck" | "Flatbed" | "Moffet" | "Non Applicable";
type RelationCompagnie = "fournisseur" | "sous-traitant";

type PurchaseOrderWithRelations = bons_commande & {
  demande_achat: demandes_achat & {
    projet: {
      numero_projet: string;
      nom: string;
      addresseLivraison: string | null;
      surintendant: string | null;
    } | null;
    fournisseur: {
      nom_fournisseur: string | null;
      adresse_ligne1: string | null;
      ville: string | null;
      code_postal: string | null;
    } | null;
    delivery_option: DeliveryOption;
    type_livraison: TypeLivraison;
    relation_compagnie: RelationCompagnie;
  };
  lignes: {
    description_article: string;
    quantite: number;
    prix_unitaire: number;
    commentaire: string | null;
    ligne_demande?: {
      activite: {
        numero_activite: string;
      } | null;
    } | null;
  }[];
};

const PDF_STORAGE: { [key: string]: Uint8Array } = {};

// Column configuration
const COLUMNS = [
  { x: 60, width: 290, align: 'left' },   // DÉTAILS
  { x: 350, width: 70, align: 'center' }, // QTÉ
  { x: 420, width: 80, align: 'right' },  // $/UNITÉ
  { x: 500, width: 80, align: 'right' }   // TOTAL
];

const TABLE_START_X = COLUMNS[0].x;
const TABLE_WIDTH = COLUMNS.reduce((sum, col) => sum + col.width, 0);
const COLUMN_BOUNDARIES = COLUMNS.map(col => col.x)
  .concat([COLUMNS[COLUMNS.length - 1].x + COLUMNS[COLUMNS.length - 1].width]);

function splitTextToLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  // Sanitize text first
  const sanitizedText = sanitizeText(text);
  
  // Split by newlines first
  const lines = sanitizedText.split('\n').filter(line => line.trim() !== '');
  const resultLines: string[] = [];

  // For each line, check if it needs to be wrapped due to width
  for (const line of lines) {
    const lineWidth = font.widthOfTextAtSize(line, fontSize);
    
    if (lineWidth <= maxWidth) {
      resultLines.push(line);
      continue;
    }

    // Only if the line is too wide, split it by words
    const words = line.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        resultLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

function calculateRowHeight(text: string, font: PDFFont, fontSize: number, maxWidth: number): number {
  const lines = splitTextToLines(text, font, fontSize, maxWidth);
  const lineHeight = 15;
  const topPadding = 12;
  const bottomPadding = 12;
  return Math.max(30, lines.length * lineHeight + topPadding + bottomPadding);
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-CA', { 
    style: 'currency', 
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol'
  }).replace('CA', ''); // Remove the 'CA' from 'CA$' to show just '$'
}

function sanitizeText(text: string): string {
  if (!text) return '';
  // Replace Windows line endings with Unix line endings
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove any other problematic characters
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');
}

function drawCenteredText(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, fontSize: number, align: 'left' | 'center' | 'right' = 'left') {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  let xPos = x;

  if (align === 'right') {
    xPos = x + width - textWidth - 5;
  } else if (align === 'center') {
    xPos = x + (width - textWidth) / 2;
  } else {
    xPos = x + 5;
  }

  page.drawText(text, {
    x: xPos,
    y,
    size: fontSize,
    font,
  });
}

function drawMultilineText(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, fontSize: number, lineHeight: number, align: 'left' | 'center' | 'right' = 'left'): number {
  const sanitizedText = sanitizeText(text);
  const lines = splitTextToLines(sanitizedText, font, fontSize, width - 10);
  let currentY = y;
  
  for (const line of lines) {
    drawCenteredText(page, line, x, currentY, width, font, fontSize, align);
    currentY -= lineHeight;
  }
  
  return currentY;
}

export async function generatePurchaseOrderPDF(numero_bon_commande: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes('po:read');

    if (!canRead) {
      throw new Error("Unauthorized");
    }

    const po = await db.bons_commande.findUnique({
      where: { numero_bon_commande },
      include: {
        demande_achat: {
          include: {
            projet: true,
            fournisseur: true
          }
        },
        lignes: {
          include: {
            ligne_demande: {
              include: {
                activite: true
              }
            }
          }
        }
      }
    }) as PurchaseOrderWithRelations | null;

    if (!po) throw new Error('Purchase order not found');

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([8.5 * 72, 11 * 72]);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add watermark if status is "Annulé" or "En révision"
    if (po.statut === "Annulé" || po.statut === "En révision") {
      const watermarkText = po.statut === "En révision" ? "RÉVISION" : "ANNULÉ";
      const watermarkSize = 190;
      const font = helveticaBoldFont;
      const textWidth = font.widthOfTextAtSize(watermarkText, watermarkSize);
      const textHeight = font.heightAtSize(watermarkSize);
      
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      //console.log(pageWidth, pageHeight);
      const centerX = 10;
      const centerY = pageHeight-50;
      
      // Draw the watermark text
      page.drawText(watermarkText, {
        x: centerX ,
        y: centerY ,
        size: watermarkSize,
        font: font,
        color: rgb(1, 0, 0),
        opacity: 0.1,
        rotate: degrees(-55)
      });
    }

    const DrawLogo = async () => {
      // Add logo
      try {
        const logoPath = join(process.cwd(), 'public', 'logo.png');
        if (existsSync(logoPath)) {
          const logoBuffer = readFileSync(logoPath);
          const logoImage = await pdfDoc.embedPng(new Uint8Array(logoBuffer));
          const logoDims = logoImage.scale(0.05);
          page.drawImage(logoImage, {
            x: 50,
            y: page.getHeight() - 100,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      } catch (error) {
        console.warn('Error loading logo:', error);
      }
    }; await DrawLogo();

    // Company Info
    page.drawText('Constructions Seni inc', { x: 50, y: page.getHeight() - 120, size: 10, font: helveticaFont });
    page.drawText('9570 Boul Henri Bourassa Est', { x: 50, y: page.getHeight() - 135, size: 10, font: helveticaFont });
    page.drawText('Montreal, Québec, Canada', { x: 50, y: page.getHeight() - 150, size: 10, font: helveticaFont });
    page.drawText('H1E 2S4', { x: 50, y: page.getHeight() - 165, size: 10, font: helveticaFont });
    page.drawText('Tél: (514) 849-0263', { x: 50, y: page.getHeight() - 180, size: 10, font: helveticaFont });

    const DrawPOHeader = async () => {
    // PO Header
    page.drawText('Bon de commande', { x: page.getWidth() - 200, y: page.getHeight() - 50, size: 10, font: helveticaBoldFont });
    page.drawText(po.numero_bon_commande, { x: page.getWidth() - 200, y: page.getHeight() - 80, size: 20, font: helveticaBoldFont });
      // Dates
      page.drawText('Date émis', { 
        x: page.getWidth() - 200, 
        y: page.getHeight() - 100, 
        size: 10, 
        font: helveticaFont 
      });
      page.drawText(`: ${formatDate(po.date_creation)}`, { 
        x: page.getWidth() - 130, // Adjust this value for desired spacing
        y: page.getHeight() - 100, 
        size: 10, 
        font: helveticaFont 
      });
      if (po.date_livraison) {
        page.drawText('Date livraison', { 
          x: page.getWidth() - 200, 
          y: page.getHeight() - 110, 
          size: 10, 
          font: helveticaFont 
        });
        page.drawText(`: ${formatDate(po.date_livraison)}`, { 
          x: page.getWidth() - 130, // Adjust this value for desired spacing
          y: page.getHeight() - 110, 
          size: 10, 
          font: helveticaFont 
        });
      }
    }; await DrawPOHeader();
    
    // Important Notice
    const noticeY = page.getHeight() - 130;
    page.drawRectangle({
      x: page.getWidth() - 300,
      y: noticeY - 60,
      width: 295,
      height: 70,
      color: rgb(1, 1, 0.9),
    });
    page.drawText('IMPORTANT', { x: page.getWidth() - 290, y: noticeY - 10, size: 10, font: helveticaBoldFont });
    page.drawText('Assurez-vous d\'inscrire le numéro de commande sur votre facture.', { x: page.getWidth() - 290, y: noticeY - 25, size: 8, font: helveticaFont });
    page.drawText('Toute facture sans ce numéro ne pourra être acceptée.', { x: page.getWidth() - 290, y: noticeY - 35, size: 8, font: helveticaFont });
    page.drawText('VEUILLEZ SVP TRANSMETTRE TOUTES VOS FACTURES', { x: page.getWidth() - 290, y: noticeY - 45, size: 8, font: helveticaFont });
    page.drawText('PAR COURRIEL À L\'ADRESSE SUIVANTE: facturation@constructionseni.com', { x: page.getWidth() - 290, y: noticeY - 55, size: 8, font: helveticaFont });



    // Supplier and Delivery Info
    const infoY = page.getHeight() - 250;
    
    // Supplier Info
    page.drawText('COMMANDE À', { x: 50, y: infoY + 40, size: 12, font: helveticaBoldFont });
    if (po.demande_achat.fournisseur) {
      page.drawText(po.demande_achat.fournisseur.nom_fournisseur || '', { x: 50, y: infoY + 20, size: 10, font: helveticaFont });
      page.drawText(po.demande_achat.fournisseur.adresse_ligne1 || '', { x: 50, y: infoY + 5, size: 10, font: helveticaFont });
      page.drawText(`${po.demande_achat.fournisseur.ville || ''}, ${po.demande_achat.fournisseur.code_postal || ''}`, { x: 50, y: infoY - 10, size: 10, font: helveticaFont });
    }

    // Delivery Info - Aligned with COMMANDE À
    page.drawText('LIVRÉ À', { x: (page.getWidth() / 2) + 10, y: infoY + 40, size: 12, font: helveticaBoldFont });
    const deliveryOptionText = po.demande_achat.delivery_option === 'pickup' ? 'Ramassage' :
                             po.demande_achat.delivery_option === 'siege_social' ? 'Siège social' :
                             'Adresse de livraison du projet';

    if (po.demande_achat.delivery_option === 'projet' && po.demande_achat.projet?.addresseLivraison) {
      if (po.demande_achat.type_livraison === 'Non Applicable') {
        if (po.demande_achat.projet?.addresseLivraison) {
          page.drawText(po.demande_achat.projet.addresseLivraison, { x: (page.getWidth() / 2) + 10, y: infoY + 20, size: 10, font: helveticaFont });
          if (po.demande_achat.projet.surintendant) {
            page.drawText(`Contact: ${po.demande_achat.projet.surintendant}`, { x: (page.getWidth() / 2) + 10, y: infoY + 5, size: 10, font: helveticaFont });
          }
        }
      } else {
        page.drawText(`Methode de livraison: ${po.demande_achat.type_livraison}`, { x: (page.getWidth() / 2) + 10, y: infoY + 20, size: 10, font: helveticaBoldFont });
        page.drawText(po.demande_achat.projet.addresseLivraison, { x: (page.getWidth() / 2) + 10, y: infoY + 5, size: 10, font: helveticaFont });
        if (po.demande_achat.projet.surintendant) {
          page.drawText(`Contact: ${po.demande_achat.projet.surintendant}`, { x: (page.getWidth() / 2) + 10, y: infoY - 10, size: 10, font: helveticaFont });
        }
      }
    } else if (po.demande_achat.delivery_option === 'siege_social') {
      page.drawText(`Methode de livraison: ${po.demande_achat.type_livraison}`, { x: (page.getWidth() / 2) + 10, y: infoY + 20, size: 10, font: helveticaBoldFont });
      page.drawText('9570 Boul Henri Bourassa Est (Porte arrière 8)', { x: (page.getWidth() / 2) + 10, y: infoY + 5, size: 10, font: helveticaFont });
      page.drawText('Montreal, Québec, H1E 2S4', { x: (page.getWidth() / 2) + 10, y: infoY - 10, size: 10, font: helveticaFont });
      page.drawText('Contact: Rejaen,  (438) 828-9548', { x: (page.getWidth() / 2) + 10, y: infoY - 25, size: 10, font: helveticaFont });
    } else if (po.demande_achat.delivery_option === 'pickup') {
      page.drawText(`Ramassage en ${po.demande_achat.type_livraison}`, { x: (page.getWidth() / 2) + 10, y: infoY + 20, size: 10, font: helveticaBoldFont });
    }

    // Project info - Restored to original position
    page.drawText('Projet ', { x: 50, y: infoY - 40, size: 12, font: helveticaBoldFont });
    page.drawText((po.demande_achat.projet?.numero_projet || '' )+ ' - ' + (po.demande_achat.projet?.nom || ''), { x: 100, y: infoY - 40, size: 10, font: helveticaFont });
  
    // Table Setup
    const tableY = infoY - 60;
    let currentY = tableY;
    const headerRowHeight = 25; // Increased header height
    const lineHeight = 15;

    const DrawTableHeader = () => {
      // Draw table header
      page.drawRectangle({
        x: TABLE_START_X,
        y: currentY - headerRowHeight,
        width: TABLE_WIDTH,
        height: headerRowHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Draw header text
      drawCenteredText(page, 'DÉTAILS', COLUMNS[0].x, currentY - headerRowHeight/2, COLUMNS[0].width, helveticaBoldFont, 9, 'left');
      drawCenteredText(page, 'QTÉ', COLUMNS[1].x, currentY - headerRowHeight/2, COLUMNS[1].width, helveticaBoldFont, 9, 'center');
      drawCenteredText(page, '$/UNITÉ', COLUMNS[2].x, currentY - headerRowHeight/2, COLUMNS[2].width, helveticaBoldFont, 9, 'right');
      drawCenteredText(page, 'TOTAL', COLUMNS[3].x, currentY - headerRowHeight/2, COLUMNS[3].width, helveticaBoldFont, 9, 'right');

      currentY -= headerRowHeight;
    }; DrawTableHeader();
    
  
    // Draw table rows
    let totalAmount = 0;
    for (const line of po.lignes) {
      const rowHeight = calculateRowHeight(line.description_article, helveticaFont, 9, COLUMNS[0].width - 10);
      
      // Check if we need to start a new page
      const VERTICAL_MARGIN = 50;
      const NEW_PAGE_TABLE_START_Y = page.getHeight() - VERTICAL_MARGIN - 100;
      if(currentY - rowHeight < VERTICAL_MARGIN){
        page = pdfDoc.addPage([8.5 * 72, 11 * 72]);;
        currentY = page.getHeight() - VERTICAL_MARGIN;
        await DrawLogo();
        await DrawPOHeader();
        currentY = NEW_PAGE_TABLE_START_Y;
        DrawTableHeader();
      }
      
      // Draw row background and borders
      page.drawRectangle({
        x: TABLE_START_X,
        y: currentY - rowHeight,
        width: TABLE_WIDTH,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Draw vertical borders between columns
      for (let i = 1; i < COLUMN_BOUNDARIES.length - 1; i++) {
        page.drawLine({
          start: { x: COLUMN_BOUNDARIES[i], y: currentY },
          end: { x: COLUMN_BOUNDARIES[i], y: currentY - rowHeight },
          color: rgb(0, 0, 0),
          thickness: 1,
        });
      }

      // Draw cell contents
      const lineTotal = line.quantite * line.prix_unitaire;
      totalAmount += lineTotal;
      const activityNumber = line.ligne_demande?.activite?.numero_activite || '';

      // Draw description with exact line breaks
      const descriptionY = currentY - 12;
      drawMultilineText(
        page,
        sanitizeText(activityNumber + ' : ' + line.description_article),
        COLUMNS[0].x,
        descriptionY,
        COLUMNS[0].width,
        helveticaFont,
        9,
        15,
        'left'
      );

      // Draw other cell contents centered vertically relative to the row height
      const cellMiddleY = currentY - rowHeight/2;
      drawCenteredText(page, line.quantite.toString(), COLUMNS[1].x, cellMiddleY, COLUMNS[1].width, helveticaFont, 9, 'center');
      drawCenteredText(page, formatCurrency(Number(line.prix_unitaire)), COLUMNS[2].x, cellMiddleY, COLUMNS[2].width, helveticaFont, 9, 'right');
      drawCenteredText(page, formatCurrency(Number(lineTotal)), COLUMNS[3].x, cellMiddleY, COLUMNS[3].width, helveticaFont, 9, 'right');

      currentY -= rowHeight;
    }

    // Draw total row
    const totalRowHeight = 30;
    page.drawRectangle({
      x: TABLE_START_X,
      y: currentY - totalRowHeight,
      width: TABLE_WIDTH,
      height: totalRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Draw total text
    drawCenteredText(page, 'Total:', COLUMNS[2].x, currentY - totalRowHeight/2, COLUMNS[2].width, helveticaBoldFont, 9, 'right');
    drawCenteredText(page, formatCurrency(totalAmount), COLUMNS[3].x, currentY - totalRowHeight/2, COLUMNS[3].width, helveticaBoldFont, 9, 'right');

    currentY -= totalRowHeight + 20; // Add some spacing after the table

    // Merge with clauses PDF
    const mergedPdf = await PDFDocument.create();
    const poPdfBytes = await pdfDoc.save();
    const poPdf = await PDFDocument.load(poPdfBytes);
    const poPages = await mergedPdf.copyPages(poPdf, poPdf.getPageIndices());
    poPages.forEach(page => mergedPdf.addPage(page));

    try {
      //Get clauses PDF paths
      const clausesFournisseurPath = join(process.cwd(), 'public', 'clauses-fournisseur.pdf');
      const clausesSousTraitantPath = join(process.cwd(), 'public', 'clauses-sous-traitant.pdf');
      console.log(clausesFournisseurPath, clausesSousTraitantPath);

      //Load clauses PDF buffers
      const clauseFournisseurBuffer = readFileSync(clausesFournisseurPath);
      const clauseSousTraitantBuffer = readFileSync(clausesSousTraitantPath);
      if(!clauseFournisseurBuffer || !clauseSousTraitantBuffer) throw new Error("Unable to load clauses PDF buffers");
      
      // Get clause type from DB
      let clauseType = po.demande_achat.relation_compagnie;
      if(!clauseType) clauseType = "fournisseur" //Temp

      console.log(clauseType, "PDF-1? :", existsSync(clausesFournisseurPath), "PDF-2? :", existsSync(clausesSousTraitantPath));
      if (existsSync(clausesFournisseurPath) && existsSync(clausesSousTraitantPath)){
        const clausesBuffer = clauseType === "sous-traitant" ? clauseSousTraitantBuffer : clauseFournisseurBuffer;
        const clausesPdf = await PDFDocument.load(new Uint8Array(clausesBuffer));
        const clausesPages = await mergedPdf.copyPages(clausesPdf, clausesPdf.getPageIndices());
        clausesPages.forEach(page => mergedPdf.addPage(page));
      }
    } catch (error) {
      console.warn('Error loading clauses PDF:', error);
    }

    const finalPdfBytes = await mergedPdf.save();
    PDF_STORAGE[numero_bon_commande] = finalPdfBytes;

    setTimeout(() => {
      delete PDF_STORAGE[numero_bon_commande];
    }, 5 * 60 * 1000);

    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function getPDF(numero_bon_commande: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const permissions = await getUserPermissionsServer(user.id);
    const canRead = permissions.includes('po:read');

    if (!canRead) {
      throw new Error("Unauthorized");
    }

    const pdfData = PDF_STORAGE[numero_bon_commande];
    if (!pdfData) throw new Error('PDF not found or expired');
    return pdfData;
  } catch (error) {
    console.error('Error getting PDF:', error);
    throw error;
  }
}