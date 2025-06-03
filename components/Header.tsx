import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileNav } from "./mobile-nav";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <MobileNav />
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Seni Apps Logo"
              width={100}
              height={40}
              className="object-contain"
              priority
            />
            <h1 className="ml-2 text-xl font-bold">Seni Apps</h1>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
