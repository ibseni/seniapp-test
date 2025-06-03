"use server";

import { db } from "@/src/lib/prisma";

export async function generatePRNumber() {
  // Get the latest PR number
  const latestPR = await db.demandes_achat.findFirst({
    orderBy: {
      numero_demande_achat: 'desc',
    },
    select: {
      numero_demande_achat: true,
    },
  });

  if (!latestPR) {
    return 'PR-000-001';
  }

  // Extract the numeric part
  const currentNumber = parseInt(latestPR.numero_demande_achat.split('-')[2]);
  const nextNumber = currentNumber + 1;

  // Format with leading zeros
  return `PR-000-${nextNumber.toString().padStart(3, '0')}`;
} 