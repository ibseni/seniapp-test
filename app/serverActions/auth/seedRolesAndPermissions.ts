"use server";

import { db } from "@/src/lib/prisma";

const permissions = [
  // PR Permissions
  { action: "create:pr", description: "Créer une demande d'achat" },
  { action: "read:pr", description: "Voir les demandes d'achat" },
  { action: "update:pr", description: "Modifier une demande d'achat" },
  { action: "delete:pr", description: "Supprimer une demande d'achat" },
  { action: "approve:pr", description: "Approuver une demande d'achat" },
  
  // PO Permissions
  { action: "create:po", description: "Créer un bon de commande" },
  { action: "read:po", description: "Voir les bons de commande" },
  { action: "update:po", description: "Modifier un bon de commande" },
  { action: "delete:po", description: "Supprimer un bon de commande" },
  
  // Project Permissions
  { action: "create:project", description: "Créer un projet" },
  { action: "read:project", description: "Voir les projets" },
  { action: "update:project", description: "Modifier un projet" },
  { action: "delete:project", description: "Supprimer un projet" },
  
  // Supplier Permissions
  { action: "create:supplier", description: "Créer un fournisseur" },
  { action: "read:supplier", description: "Voir les fournisseurs" },
  { action: "update:supplier", description: "Modifier un fournisseur" },
  { action: "delete:supplier", description: "Supprimer un fournisseur" },
  
  // Activity Permissions
  { action: "create:activity", description: "Créer une activité" },
  { action: "read:activity", description: "Voir les activités" },
  { action: "update:activity", description: "Modifier une activité" },
  { action: "delete:activity", description: "Supprimer une activité" },
  
  // User Management
  { action: "manage:users", description: "Gérer les utilisateurs" },
  { action: "manage:roles", description: "Gérer les rôles" },
];

const roles = [
  {
    name: "admin",
    description: "Administrateur système",
    permissions: ["*"], // All permissions
  },
  {
    name: "directeur_projet",
    description: "Directeur de projet",
    permissions: [
      "read:pr", "create:pr", "update:pr", "approve:pr",
      "read:po", "create:po", "update:po",
      "read:project", "create:project", "update:project",
      "read:supplier", "create:supplier", "update:supplier",
      "read:activity", "create:activity", "update:activity",
    ],
  },
  {
    name: "gestionnaire_projet",
    description: "Gestionnaire de projet",
    permissions: [
      "read:pr", "create:pr", "update:pr", "approve:pr",
      "read:po", "create:po",
      "read:project", "update:project",
      "read:supplier", "create:supplier",
      "read:activity",
    ],
  },
  {
    name: "coordonateur_projet",
    description: "Coordonateur de projet",
    permissions: [
      "read:pr", "create:pr", "update:pr",
      "read:po",
      "read:project", "update:project",
      "read:supplier",
      "read:activity",
    ],
  },
  {
    name: "adjointe_projet",
    description: "Adjointe de projet",
    permissions: [
      "read:pr", "create:pr",
      "read:po",
      "read:project",
      "read:supplier",
      "read:activity",
    ],
  },
];

export async function seedRolesAndPermissions() {
  try {
    // Create permissions
    const createdPermissions = await Promise.all(
      permissions.map(async (permission) => {
        return await db.permissions.upsert({
          where: { action: permission.action },
          update: permission,
          create: permission,
        });
      })
    );

    // Create roles with their permissions
    await Promise.all(
      roles.map(async (role) => {
        const permissionRecords = role.permissions[0] === "*" 
          ? createdPermissions 
          : createdPermissions.filter(p => role.permissions.includes(p.action));

        await db.roles.upsert({
          where: { name: role.name },
          update: {
            description: role.description,
            permissions: {
              set: permissionRecords.map(p => ({ id: p.id })),
            },
          },
          create: {
            name: role.name,
            description: role.description,
            permissions: {
              connect: permissionRecords.map(p => ({ id: p.id })),
            },
          },
        });
      })
    );

    return { success: true };
  } catch (error) {
    console.error("Error seeding roles and permissions:", error);
    return { success: false, error: "Failed to seed roles and permissions" };
  }
} 