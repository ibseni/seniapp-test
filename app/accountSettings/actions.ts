"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/prisma";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}

export async function getUserRolesServer(userId: string): Promise<string[]> {
  try {
    console.log('Fetching roles for user:', userId);
    const result = await db.$queryRaw<{ role_name: string }[]>`
      SELECT r.name as role_name
      FROM users u
      JOIN "_rolesTousers" ru ON ru."B" = u.id
      JOIN roles r ON r.id = ru."A"
      WHERE u.id = ${userId}
    `;

    console.log('Raw query result:', JSON.stringify(result, null, 2));

    if (!result || result.length === 0) {
      console.log('No roles found in the database');
      return [];
    }

    const roles = result.map(row => row.role_name);
    console.log('Mapped roles:', roles);

    return roles;
  } catch (err) {
    const error = err as Error;
    console.error("Error getting user roles:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
}

export async function getUserPermissionsServer(userId: string): Promise<string[]> {
  try {
    console.log('Fetching permissions for user:', userId);
    const result = await db.$queryRaw<{ action: string }[]>`
      SELECT DISTINCT p.action
      FROM users u
      JOIN "_rolesTousers" ru ON ru."B" = u.id
      JOIN roles r ON r.id = ru."A"
      JOIN "_permissionsToroles" pr ON pr."B" = r.id
      JOIN permissions p ON p.id = pr."A"
      WHERE u.id = ${userId}
      ORDER BY p.action
    `;

    console.log('Raw query result:', JSON.stringify(result, null, 2));

    if (!result || result.length === 0) {
      console.log('No permissions found in the database');
      return [];
    }

    const permissions = result.map(row => row.action);
    //console.log('Mapped permissions:', permissions);

    return permissions;
  } catch (err) {
    const error = err as Error;
    console.error("Error getting user permissions:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
} 