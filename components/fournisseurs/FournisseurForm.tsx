"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
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
import { useRouter } from "next/navigation";
import { addFournisseur } from "@/app/serverActions/fournisseurs/addFournisseur";
import { updateFournisseur } from "@/app/serverActions/fournisseurs/updateFournisseur";

interface FournisseurFormData {
  id?: string;
  numero_fournisseur: string;
  nom_fournisseur: string | null;
  adresse_ligne1: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone1: string | null;
  nom_responsable: string | null;
  poste_telephone1?: string | null;
  telephone2?: string | null;
  telecopieur?: string | null;
  telephone_autre?: string | null;
}

const formSchema = z.object({
  numero_fournisseur: z.string().length(10, "Le numéro de fournisseur doit avoir 10 caractères").toUpperCase(),
  nom_fournisseur: z.string().min(1, "Le nom est requis"),
  adresse_ligne1: z.string().min(1, "L'adresse est requise"),
  ville: z.string().min(1, "La ville est requise"),
  code_postal: z.string().min(1, "Le code postal est requis"),
  telephone1: z.string().min(1, "Le téléphone est requis"),
  nom_responsable: z.string().min(1, "Le nom du responsable est requis"),
  poste_telephone1: z.string().optional(),
  telephone2: z.string().optional(),
  telecopieur: z.string().optional(),
  telephone_autre: z.string().optional(),
});

interface FournisseurFormProps {
  initialData?: FournisseurFormData;
}

export function FournisseurForm({ initialData }: FournisseurFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_fournisseur: initialData?.numero_fournisseur ?? "",
      nom_fournisseur: initialData?.nom_fournisseur ?? "",
      adresse_ligne1: initialData?.adresse_ligne1 ?? "",
      ville: initialData?.ville ?? "",
      code_postal: initialData?.code_postal ?? "",
      telephone1: initialData?.telephone1 ?? "",
      nom_responsable: initialData?.nom_responsable ?? "",
      poste_telephone1: initialData?.poste_telephone1 ?? "",
      telephone2: initialData?.telephone2 ?? "",
      telecopieur: initialData?.telecopieur ?? "",
      telephone_autre: initialData?.telephone_autre ?? "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const addData = {
        numero_fournisseur: data.numero_fournisseur,
        nom_fournisseur: data.nom_fournisseur,
        adresse_ligne1: data.adresse_ligne1,
        ville: data.ville,
        code_postal: data.code_postal,
        telephone1: data.telephone1,
        nom_responsable: data.nom_responsable,
        poste_telephone1: data.poste_telephone1,
        telephone2: data.telephone2,
        telecopieur: data.telecopieur,
        telephone_autre: data.telephone_autre,
      };

      const updateData = {
        numero_fournisseur: data.numero_fournisseur || undefined,
        nom_fournisseur: data.nom_fournisseur || undefined,
        adresse_ligne1: data.adresse_ligne1 || undefined,
        ville: data.ville || undefined,
        code_postal: data.code_postal || undefined,
        telephone1: data.telephone1 || undefined,
        nom_responsable: data.nom_responsable || undefined,
        poste_telephone1: data.poste_telephone1 || undefined,
        telephone2: data.telephone2 || undefined,
        telecopieur: data.telecopieur || undefined,
        telephone_autre: data.telephone_autre || undefined,
      };

      if (initialData?.id) {
        await updateFournisseur(initialData.id, updateData);
      } else {
        await addFournisseur(addData);
      }
      router.push("/achats/fournisseurs");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numero_fournisseur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de fournisseur</FormLabel>
              <FormControl>
                <Input placeholder="Numéro de fournisseur" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nom_fournisseur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom du fournisseur" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adresse_ligne1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input placeholder="Adresse" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ville"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ville</FormLabel>
              <FormControl>
                <Input placeholder="Ville" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code_postal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code postal</FormLabel>
              <FormControl>
                <Input placeholder="Code postal" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telephone1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="Téléphone" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="poste_telephone1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poste téléphonique</FormLabel>
              <FormControl>
                <Input placeholder="Poste téléphonique" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telephone2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone 2</FormLabel>
              <FormControl>
                <Input placeholder="Téléphone 2" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telecopieur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Télécopieur</FormLabel>
              <FormControl>
                <Input placeholder="Télécopieur" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telephone_autre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Autre téléphone</FormLabel>
              <FormControl>
                <Input placeholder="Autre téléphone" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nom_responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du responsable</FormLabel>
              <FormControl>
                <Input placeholder="Nom du responsable" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Enregistrer</Button>
      </form>
    </Form>
  );
} 