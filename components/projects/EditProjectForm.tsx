"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProject } from "@/app/serverActions/projects/updateProject";

const formSchema = z.object({
  numero_projet: z.string().min(1, "Le numéro de projet est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  addresse: z.string().min(1, "L'adresse est requise"),
  addresseLivraison: z.string().optional(),
  id_dossier_commande: z.string().optional(),
  surintendant: z.string().optional(),
  coordonateur_projet: z.string().optional(),
  charge_de_projet: z.string().optional(),
  directeur_de_projet: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditProjectFormProps {
  project?: {
    id: string;
    numero_projet: string;
    nom: string;
    addresse: string;
    addresseLivraison?: string | null;
    id_dossier_commande?: string | null;
    surintendant?: string | null;
    coordonateur_projet?: string | null;
    charge_de_projet?: string | null;
    directeur_de_projet?: string | null;
  };
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? {
      numero_projet: project.numero_projet,
      nom: project.nom,
      addresse: project.addresse,
      addresseLivraison: project.addresseLivraison || "",
      id_dossier_commande: project.id_dossier_commande || "",
      surintendant: project.surintendant || "",
      coordonateur_projet: project.coordonateur_projet || "",
      charge_de_projet: project.charge_de_projet || "",
      directeur_de_projet: project.directeur_de_projet || "",
    } : {
      numero_projet: "",
      nom: "",
      addresse: "",
      addresseLivraison: "",
      id_dossier_commande: "",
      surintendant: "",
      coordonateur_projet: "",
      charge_de_projet: "",
      directeur_de_projet: "",
    },
  });

  async function onSubmit(data: FormData) {
    if (!project) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateProject({
        id: project.id,
        ...data,
      });

      if (result.success) {
        router.push("/projets");
        router.refresh();
      } else {
        console.error("Failed to update project:", result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="numero_projet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de projet</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="addresse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="addresseLivraison"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse de livraison</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="id_dossier_commande"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID dossier commande</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="surintendant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surintendant</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coordonateur_projet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordonateur de projet</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="charge_de_projet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chargé de projet</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="directeur_de_projet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Directeur de projet</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/projets")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 