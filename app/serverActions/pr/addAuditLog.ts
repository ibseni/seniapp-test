"use server";

import { db } from "@/src/lib/prisma";

export interface AddAuditLogData {
  id_demande_achat: string;
  action: string;
  description: string;
  email_utilisateur: string;
}

export async function addAuditLog(data: AddAuditLogData) {
  try {
    const log = await db.audit_logs.create({
      data: {
        id_demande_achat: data.id_demande_achat,
        action: data.action,
        description: data.description,
        email_utilisateur: data.email_utilisateur,
      },
    });

    return { success: true, data: log };
  } catch (error) {
    console.error("Error adding audit log:", error);
    return { success: false, error: "Failed to add audit log" };
  }
} 