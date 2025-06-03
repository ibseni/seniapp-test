"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileTextIcon, 
  Home,
  ShoppingCart,
  ClipboardList,
  Package,
  Users,
  Building2,
  FolderKanban
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  permissions?: string[];
}

export function Sidebar({ className, permissions = [] }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            <Link href="/">
              <Button 
                variant={pathname === "/" ? "secondary" : "ghost"} 
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </Button>
            </Link>
          </div>
        </div>

        {pathname.startsWith('/achats') && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Achats
            </h2>
            <div className="space-y-1">
              <Link href="/achats/pr">
                <Button 
                  variant={pathname === "/achats/pr" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Demandes d'achat (PR)
                </Button>
              </Link>
              <Link href="/achats/po">
                <Button 
                  variant={pathname === "/achats/po" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Bon de commandes (PO)
                </Button>
              </Link>
              {permissions.includes('po:export') && (
                <Link href="/achats/Avantage">
                  <Button 
                    variant={pathname === "/achats/Avantage" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Integration Avantage
                  </Button>
                </Link>
              )}
              <Link href="/achats/fournisseurs">
                <Button 
                  variant={pathname === "/achats/fournisseurs" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Fournisseurs
                </Button>
              </Link>
            </div>
          </div>
        )}

        {pathname.startsWith('/projets') && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Projets
            </h2>
            <div className="space-y-1">
              <Link href="/projets">
                <Button 
                  variant={pathname === "/projets" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Liste des projets
                </Button>
              </Link>
              <Link href="/projets/new">
                <Button 
                  variant={pathname === "/projets/new" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Nouveau projet
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Link href="/accountSettings">
              <Button 
                variant={pathname === "/accountSettings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 