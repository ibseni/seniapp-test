import { db } from "@/src/lib/prisma";
import { createClient } from "@/utils/supabase/client";

interface Permission {
  id: string;
  action: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  permissions: Permission[];
}

interface UserWithRoles {
  roles: Role[];
}

interface UserWithRoleNames {
  name: string;
}

interface UserRecord {
  id: string;
}

// Ensure user exists in our database
async function ensureUserExists(supabaseUserId: string, email: string) {
  try {
    console.log('Checking if user exists:', supabaseUserId);
    const existingUser = await db.$queryRaw<UserRecord[]>`
      SELECT id FROM users WHERE id = ${supabaseUserId}
    `;

    if (!existingUser || existingUser.length === 0) {
      console.log('User does not exist, creating...');
      // Create user if doesn't exist
      await db.$executeRaw`
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (${supabaseUserId}, ${email}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      console.log('Assigning default role...');
      // Assign default role (Adjointe au projet)
      await db.$executeRaw`
        INSERT INTO "_rolesTousers" ("A", "B")
        VALUES ('2', ${supabaseUserId})
      `;
      console.log('Default role assigned');
    } else {
      console.log('User exists:', existingUser);
    }
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
}

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    console.log('Starting getUserRoles for userId:', userId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No Supabase user found');
      return [];
    }
    
    console.log('Supabase user:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    });
    await ensureUserExists(user.id, user.email!);

    console.log('Fetching roles for user:', user.id);
    const result = await db.$queryRaw<{ role_name: string }[]>`
      SELECT r.name as role_name
      FROM users u
      JOIN "_rolesTousers" ru ON ru."B" = u.id
      JOIN roles r ON r.id = ru."A"
      WHERE u.id = ${user.id}
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

export async function hasPermission(userId: string, requiredAction: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    await ensureUserExists(user.id, user.email!);

    const result = await db.$queryRaw<UserWithRoles[]>`
      SELECT r.*, p.*
      FROM users u
      JOIN "_rolesTousers" ru ON ru."B" = u.id
      JOIN roles r ON r.id = ru."A"
      JOIN "_permissionsToRoles" pr ON pr."B" = r.id
      JOIN permissions p ON p.id = pr."A"
      WHERE u.id = ${user.id}
    `;

    if (!result || result.length === 0) return false;

    return result[0].roles.some(role =>
      role.permissions.some(permission => permission.action === requiredAction)
    );
  } catch (error) {
    console.error("Error checking permissions:", error);
    return false;
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];
    
    await ensureUserExists(user.id, user.email!);

    const result = await db.$queryRaw<UserWithRoles[]>`
      SELECT r.*, p.*
      FROM users u
      JOIN "_rolesTousers" ru ON ru."B" = u.id
      JOIN roles r ON r.id = ru."A"
      JOIN "_permissionsToRoles" pr ON pr."B" = r.id
      JOIN permissions p ON p.id = pr."A"
      WHERE u.id = ${user.id}
    `;

    if (!result || result.length === 0) return [];

    const permissions = new Set<string>();
    result[0].roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission.action);
      });
    });

    return Array.from(permissions);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
} 