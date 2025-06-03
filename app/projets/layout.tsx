import Header from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";
import { getUserPermissionsServer } from "@/app/accountSettings/actions";
import { redirect } from "next/navigation";

export default async function ProjetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = await getUserPermissionsServer(user.id);

  return (
    <div className="min-h-screen bg-background">
      <Header className="print:hidden" />
      <div className="flex">
        <aside className="hidden md:block print:hidden w-64 border-r min-h-[calc(100vh-3.5rem)] bg-background">
          <Sidebar permissions={permissions} />
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 