"use client";

import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getUserRolesServer, getUserPermissionsServer, signOut } from "./actions";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

interface Props {
  initialEmail: string;
  initialName: string;
  initialAvatarUrl: string;
  userId: string;
}

export default function AccountSettingsForm({ 
  initialEmail, 
  initialName, 
  initialAvatarUrl,
  userId 
}: Props) {
  const router = useRouter();
  const [changedEmail, setChangedEmail] = useState(initialEmail);
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(initialName);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Fetching roles for user:", userId);
        const [roles, permissions] = await Promise.all([
          getUserRolesServer(userId),
          getUserPermissionsServer(userId)
        ]);
        console.log("Fetched roles:", roles);
        console.log("Fetched permissions:", permissions);
        setUserRoles(roles);
        setUserPermissions(permissions);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Error loading user data");
      }
    };
    loadUserData();
  }, [userId]);

  const handleResetPassword = () => {
    router.push("/password-reset");
  };

  const handleSaveAccount = async () => {
    setIsSaving(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { name: name, full_name: name },
    });

    if (error) {
      console.error("Error saving account:", error);
      setError("Error saving account details");
      setIsSaving(false);
      return null;
    }
    setIsSaving(false);
    return data;
  };

  const handleInvitation = async () => {
    const email = prompt("Send invitation to email:");
    if (!email) {
      console.error("No valid Email");
      return;
    }
  };

  const handleChangeEmail = async () => {
    router.push("/email-reset");
  };

  const formatPermission = (permission: string) => {
    const [action, resource] = permission.split(':');
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Gérez votre profil et vos informations personnelles
        </p>
      </div>
      <Separator />
      <div className="space-y-6">
        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                placeholder="Entrez votre nom"
                value={name}
                disabled={true}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Entrez votre email"
                type="email"
                value={changedEmail}
                disabled={true}
                onChange={(e) => setChangedEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rôles</Label>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map((role, index) => (
                    <Badge key={index} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <div className="text-muted-foreground">Aucun rôle assigné</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {userPermissions.length > 0 ? (
                  userPermissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="justify-start">
                      {formatPermission(permission)}
                    </Badge>
                  ))
                ) : (
                  <div className="text-muted-foreground">Aucune permission</div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              ID utilisateur: {userId}
            </div>
          </div>
        </div>

        

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Déconnexion</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button variant="destructive" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 