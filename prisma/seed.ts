import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    // Read the CSV file
    const csvFilePath = path.join(__dirname, 'liste.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    // Parse CSV content with normalized headers
    const records = parse(fileContent, {
      columns: (header: string[]) => header.map(column => column.trim()),
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} records to import`);
    console.log('First record sample:', records[0]); // Debug log

    // Insert records
    for (const record of records) {
      // Skip records without numero_activite
      if (!record.numero_activite) {
        console.log('Skipping record without numero_activite:', record);
        continue;
      }

      // Handle empty strings for optional fields
      const code_interne = record.code_interne || null;
      const numero_fournisseur = record.numero_fournisseur || null;
      const numero_gl_achat = record.numero_gl_achat || null;

      const data = {
        numero_activite: record.numero_activite.toString().trim(),
        valid: record.valid === 'true' || false,
        description_fr: (record.description_fr || '').toString().trim(),
        description_en: (record.description_en || '').toString().trim(),
        code_interne,
        numero_fournisseur,
        numero_gl_achat,
      };

      console.log('Inserting record:', data); // Debug log

      await prisma.activites.create({
        data
      });
    }

    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error during import:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 