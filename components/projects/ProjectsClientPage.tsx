"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ProjectsTable } from "@/components/projects/ProjectsTable";

interface ProjectsClientPageProps {
  projects: any[];
  canCreate: boolean;
}

export function ProjectsClientPage({ projects, canCreate }: ProjectsClientPageProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projets</h2>
          <p className="text-muted-foreground">
            Liste des projets
          </p>
        </div>
        {canCreate && (
          <Link href="/projets/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau Projet
            </Button>
          </Link>
        )}
      </div>
      <ProjectsTable data={projects} />
    </div>
  );
} 