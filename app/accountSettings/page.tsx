export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import AccountSettingsForm from "./AccountSettingsForm";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default async function AccountSettingsPage() {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting user:", error);
      return <div>Error loading user data</div>;
    }

    if (!user) {
      return <div>Please log in to view this page</div>;
    }

    return (
      <>
        <Header />
        <div className="flex-1 space-y-4 pt-4 px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Paramètres du compte</h2>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et vos préférences
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/">
                <Button variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <AccountSettingsForm 
            initialEmail={user.email ?? ""}
            initialName={user.user_metadata.name ?? ""}
            initialAvatarUrl={user.user_metadata.picture ?? ""}
            userId={user.id}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in AccountSettingsPage:", error);
    return <div>An error occurred while loading the page</div>;
  }
} 