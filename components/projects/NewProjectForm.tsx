"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addProject } from "@/app/serverActions/projects/addProject";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  numero_projet: z.string().min(1, {
    message: "Le numéro de projet est requis.",
  }),
  nom: z.string().min(1, {
    message: "Le nom du projet est requis.",
  }),
  addresse: z.string().min(1, {
    message: "L'adresse est requise.",
  }),
  addresseLivraison: z.string().optional(),
  id_dossier_commande: z.string().optional(),
  surintendant: z.string().email({
    message: "Doit être une adresse email valide.",
  }).optional().or(z.literal("")),
  coordonateur_projet: z.string().email({
    message: "Doit être une adresse email valide.",
  }).optional().or(z.literal("")),
  charge_de_projet: z.string().email({
    message: "Doit être une adresse email valide.",
  }).optional().or(z.literal("")),
  directeur_de_projet: z.string().email({
    message: "Doit être une adresse email valide.",
  }).optional().or(z.literal("")),
});

export function NewProjectForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await addProject(values);
      if (result.success) {
        toast.success("Projet créé avec succès");
        router.push("/projets");
        router.refresh();
      } else {
        toast.error("Erreur lors de la création du projet");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="numero_projet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de projet</FormLabel>
                    <FormControl>
                      <Input placeholder="PR-001" {...field} />
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
                    <FormLabel>Nom du projet</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du projet" {...field} />
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
                      <Input placeholder="Adresse du projet" {...field} />
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
                      <Input placeholder="Adresse de livraison" {...field} />
                    </FormControl>
                    <FormDescription>
                      Adresse de livraison si différente de l'adresse du projet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_dossier_commande"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Dossier commande</FormLabel>
                    <FormControl>
                      <Input placeholder="ID du dossier" {...field} />
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
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Adresse email du surintendant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coordonateur_projet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordonateur</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Adresse email du coordonateur
                    </FormDescription>
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
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Adresse email du chargé de projet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="directeur_de_projet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Directeur</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Adresse email du directeur
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button type="submit">
                Créer le projet
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 