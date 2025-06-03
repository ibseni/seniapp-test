import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { ShoppingCart, Users, FolderKanban } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="px-4 md:px-8 py-6 w-full">
      <h1 className="text-2xl font-bold mb-6">Seni Apps</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/achats" className="block">
          <Card className="hover:bg-muted transition-colors">
            <CardHeader>
              <CardTitle>Achats</CardTitle>
              <CardDescription>
                Gérer les demandes d'achats et les bons de commande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/projets" className="block">
          <Card className="hover:bg-muted transition-colors">
            <CardHeader>
              <CardTitle>Projets</CardTitle>
              <CardDescription>
                Gérer vos projets et suivre leur avancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/accountSettings" className="block">
          <Card className="hover:bg-muted transition-colors">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Gérer votre profil et vos préferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Users className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
