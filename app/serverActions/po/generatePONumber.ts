"use server";

import { db } from "@/src/lib/prisma";

export async function generatePONumber() {
  // Get the latest PO number
  const latestPO = await db.bons_commande.findFirst({
    orderBy: {
      numero_bon_commande: 'desc'
    }
  });

  if (!latestPO) {
    return 'PO-000-001';
  }

  // Extract the number from the latest PO number
  const match = latestPO.numero_bon_commande.match(/PO-(\d{3})-(\d{3})/);
  if (!match) {
    return 'PO-000-001';
  }

  const [_, group1, group2] = match;
  let num1 = parseInt(group1);
  let num2 = parseInt(group2);

  // Increment the numbers
  num2++;
  if (num2 > 999) {
    num1++;
    num2 = 1;
  }

  // Format the new PO number
  return `PO-${num1.toString().padStart(3, '0')}-${num2.toString().padStart(3, '0')}`;
} 