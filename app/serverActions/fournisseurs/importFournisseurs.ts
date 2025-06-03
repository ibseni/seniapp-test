"use server";

import { db } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const fournisseurSchema = z.object({
  numero_fournisseur: z.string().min(1, "Le numéro est requis"),
  nom_fournisseur: z.string().optional(),
  adresse_ligne1: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
  telephone1: z.string().optional(),
  poste_telephone1: z.string().optional(),
  telephone2: z.string().optional(),
  telecopieur: z.string().optional(),
  telephone_autre: z.string().optional(),
  nom_responsable: z.string().optional(),
});

export type ImportResult = {
  success: boolean;
  error?: string;
  validationErrors?: string[];
  data?: {
    imported: number;
    updated: number;
  };
};

export async function importFournisseurs(csvContent: string): Promise<ImportResult> {
  try {
    // Remove BOM if present and normalize line endings
    const cleanContent = csvContent
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n');
    
    // Split the CSV content into lines and remove empty lines
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, error: "Le fichier CSV est vide" };
    }

    // Get headers and validate them
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const requiredHeaders = ["numero_fournisseur"];
    const optionalHeaders = [
      "nom_fournisseur",
      "adresse_ligne1",
      "ville",
      "code_postal",
      "telephone1",
      "poste_telephone1",
      "telephone2",
      "telecopieur",
      "telephone_autre",
      "nom_responsable"
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Colonne requise manquante: numero_fournisseur`
      };
    }

    // Warn about unrecognized headers
    const validHeaders = [...requiredHeaders, ...optionalHeaders];
    const unknownHeaders = headers.filter(h => !validHeaders.includes(h));
    const warnings: string[] = [];
    if (unknownHeaders.length > 0) {
      warnings.push(`Colonnes non reconnues: ${unknownHeaders.join(', ')}`);
    }

    // Process each line
    const newFournisseurs = [];
    const updateFournisseurs = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(';');
      
      // Check if we have the right number of columns
      if (values.length !== headers.length) {
        errors.push(`Ligne ${i + 1}: Nombre de colonnes incorrect (attendu: ${headers.length}, reçu: ${values.length})`);
        continue;
      }

      // Create object with only non-empty values
      const fournisseur: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (validHeaders.includes(header)) {
          const value = values[index]?.trim() || '';
          if (value !== '') {
            fournisseur[header] = value;
          }
        }
      });

      // Always ensure numero_fournisseur is present
      if (!fournisseur.numero_fournisseur) {
        errors.push(`Ligne ${i + 1}: Numéro de fournisseur manquant`);
        continue;
      }

      try {
        const validatedFournisseur = fournisseurSchema.parse(fournisseur);
        
        // Check if this fournisseur already exists
        const existingFournisseur = await db.fournisseurs.findUnique({
          where: { numero_fournisseur: validatedFournisseur.numero_fournisseur }
        });

        if (existingFournisseur) {
          updateFournisseurs.push({
            ...validatedFournisseur,
            id: existingFournisseur.id
          });
        } else {
          newFournisseurs.push(validatedFournisseur);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const issues = error.issues.map(issue => issue.message).join(', ');
          errors.push(`Ligne ${i + 1}: ${issues}`);
        } else {
          errors.push(`Ligne ${i + 1}: Erreur de validation`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: "Erreurs de validation",
        validationErrors: [...warnings, ...errors]
      };
    }

    if (newFournisseurs.length === 0 && updateFournisseurs.length === 0) {
      return {
        success: false,
        error: "Aucun fournisseur valide à importer"
      };
    }

    // Create new fournisseurs
    if (newFournisseurs.length > 0) {
      await db.fournisseurs.createMany({
        data: newFournisseurs,
      });
    }

    // Update existing fournisseurs
    for (const fournisseur of updateFournisseurs) {
      const { id, ...updateData } = fournisseur;
      await db.fournisseurs.update({
        where: { id },
        data: updateData,
      });
    }

    const successMessage: {
      success: boolean;
      data: {
        imported: number;
        updated: number;
      };
      validationErrors?: string[];
    } = {
      success: true,
      data: {
        imported: newFournisseurs.length,
        updated: updateFournisseurs.length
      }
    };

    if (warnings.length > 0) {
      successMessage.validationErrors = warnings;
    }

    revalidatePath("/achats/fournisseurs");
    return successMessage;
  } catch (error) {
    console.error("Error importing suppliers:", error);
    return {
      success: false,
      error: "Erreur lors de l'importation des fournisseurs"
    };
  }
} 