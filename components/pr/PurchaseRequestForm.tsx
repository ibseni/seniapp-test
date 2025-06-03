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
import { format, parse } from 'date-fns'; // Import parse
import { ca, fr } from 'date-fns/locale';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { addPurchaseRequest } from "@/app/serverActions/pr/addPurchaseRequest";
import { updatePurchaseRequest } from "@/app/serverActions/pr/updatePurchaseRequest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addAuditLog } from "@/app/serverActions/pr/addAuditLog";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { CalendarIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description_article: z.string().min(1, "La description est requise"),
  quantite: z.number().min(1, "La quantité doit être supérieure à 0"),
  prix_unitaire_estime: z.number().min(0.01, "Le prix unitaire doit être supérieur à 0"),
  commentaire_ligne: z.string().optional(),
  id_activite: z.string().min(1, "L'activité est requise"),
});

const attachmentSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  url: z.string().url("L'URL n'est pas valide"),
});

const formSchema = z.object({
  id: z.string().optional(),
  id_projet: z.string({ required_error: "Le projet est requis" }).min(1, "Le projet est requis"),
  demandeur: z.string().optional(),
  statut: z.string().optional(),
  commentaire: z.string().optional(),
  date_livraison_souhaitee: z.string().min(1, "La date de livraison est requise"),
  id_fournisseur: z.string({ required_error: "Le fournisseur est requis" }).min(1, "Le fournisseur est requis"),
  relation_compagnie: z.enum(["fournisseur", "sous-traitant"], {
    required_error: "La relation est requise",
}),
  delivery_option: z.enum(["", "pickup", "siege_social", "projet"], {
    required_error: "L'option de livraison est requise",
  }).refine(val => val !== "", {
    message: "L'option de livraison est requise"
  }),
  type_livraison: z.enum(["", "Boomtruck", "Flatbed", "Moffet", "Camion_Cube", "Non Applicable"], {
    required_error: "Le type de livraison est requis",
  }).refine(val => val !== "", {
    message: "Le type de livraison est requis"
  }),
  lignes: z.array(z.object({
    description_article: z.string().min(1, "La description est requise"),
    quantite: z.number().min(1, "La quantité doit être supérieure à 0"),
    prix_unitaire_estime: z.number().min(0, "Le prix unitaire doit être positif"),
    commentaire_ligne: z.string().optional(),
    id_activite: z.string().min(1, "L'activité est requise"),
  })).min(1, "Au moins une ligne est requise"),
  pieces_jointes: z.array(attachmentSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PurchaseRequestFormProps {
  initialData?: FormData & { numero_demande_achat: string };
  projects: {
    id: string;
    numero_projet: string;
    nom: string;
  }[];
  suppliers: {
    id: string;
    numero_fournisseur: string;
    nom_fournisseur: string | null;
  }[];
  activities: {
    id: string;
    numero_activite: string;
    description_fr: string;
    description_en: string;
    code_interne: string | null;
    numero_fournisseur: string | null;
    numero_gl_achat: string | null;
  }[];
  user: {
    email: string;
  };
}

export function PurchaseRequestForm({
  initialData,
  projects,
  suppliers,
  activities,
  user,
}: PurchaseRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalEstime, setTotalEstime] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      demandeur: user.email,
      commentaire: "",
      id_projet: "",
      id_fournisseur: "",
      delivery_option: undefined,
      type_livraison: undefined,
      relation_compagnie: undefined,
      lignes: [
        {
          description_article: "",
          quantite: 1,
          prix_unitaire_estime: 0,
          commentaire_ligne: "",
          id_activite: "",
        },
      ],
    },
  });

  // Calculate total when line items change
  form.watch((value, { name }) => {
    if (name?.startsWith('lignes')) {
      const lignes = form.getValues('lignes');
      const total = lignes.reduce((sum, ligne) => {
        const quantity = Number(ligne.quantite) || 0;
        const price = Number(ligne.prix_unitaire_estime) || 0;
        return sum + (price * quantity);
      }, 0);
      setTotalEstime(total);
    }
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        // Update existing PR
        const result = await updatePurchaseRequest({
          id: initialData.id,
          ...data,
          delivery_option: data.delivery_option || undefined,
          type_livraison: data.type_livraison || undefined,
          relation_compagnie: data.relation_compagnie || "fournisseur",
          commentaire: data.commentaire || "",
          lignes: {
            update: data.lignes
              .filter((ligne): ligne is typeof ligne & { id: string } => 'id' in ligne && !!ligne.id)
              .map(ligne => ({
                id: ligne.id,
                description_article: ligne.description_article,
                quantite: ligne.quantite,
                prix_unitaire_estime: ligne.prix_unitaire_estime,
                commentaire_ligne: ligne.commentaire_ligne || "",
                id_activite: ligne.id_activite,
              })),
            create: data.lignes
              .filter(ligne => !('id' in ligne))
              .map(ligne => ({
                description_article: ligne.description_article,
                quantite: ligne.quantite,
                prix_unitaire_estime: ligne.prix_unitaire_estime,
                commentaire_ligne: ligne.commentaire_ligne || "",
                id_activite: ligne.id_activite,
              })),
          },
        });
        if (result.success) {
          // Add audit log for update
          await addAuditLog({
            id_demande_achat: initialData.id,
            action: "modification",
            description: "Modification de la demande d'achat",
            email_utilisateur: user.email,
          });
          router.push(`/achats/pr/${initialData.numero_demande_achat}`);
          router.refresh();
        } else {
          console.error("Failed to update PR:", result.error);
        }
      } else {
        // Create new PR
        const result = await addPurchaseRequest({
          ...data,
          delivery_option: data.delivery_option || "pickup",
          relation_compagnie: data.relation_compagnie || "",
          type_livraison: data.type_livraison || "Non Applicable",
          demandeur: user.email,
          commentaire: data.commentaire || "",
        });
        if (result.success && result.data) {
          // Add audit log for creation
          await addAuditLog({
            id_demande_achat: result.data.id,
            action: "creation",
            description: "Création de la demande d'achat",
            email_utilisateur: user.email,
          });
          router.push(`/achats/pr/${result.data.numero_demande_achat}`);
          router.refresh();
        } else {
          console.error("Failed to create PR:", result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (initialData?.numero_demande_achat) {
      router.push(`/achats/pr/${initialData.numero_demande_achat}`);
    } else {
      router.push('/achats/pr');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {initialData?.numero_demande_achat && (
                <div>
                  <div className="font-medium">Numéro de demande</div>
                  <div className="text-muted-foreground">
                    {initialData.numero_demande_achat}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="demandeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demandeur</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_projet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet</FormLabel>
                    <Combobox
                      items={projects.map(project => ({
                        value: project.id,
                        label: `${project.numero_projet} - ${project.nom}`
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Sélectionner un projet"
                      emptyText="Aucun projet trouvé"
                      searchPlaceholder="Rechercher un projet..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_fournisseur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compagnie</FormLabel>
                    <Combobox
                      items={suppliers.map(supplier => ({
                        value: supplier.id,
                        label: `${supplier.numero_fournisseur} - ${supplier.nom_fournisseur || ''}`
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Sélectionner une compagnie"
                      emptyText="Aucune compagnie trouvée"
                      searchPlaceholder="Rechercher une compagnie..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relation_compagnie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relation avec la compagnie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une relation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fournisseur">Fournisseur</SelectItem>
                        <SelectItem value="sous-traitant">Sous-traitant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option de livraison</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une option de livraison" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pickup">Ramassage</SelectItem>
                        <SelectItem value="siege_social">Siège social</SelectItem>
                        <SelectItem value="projet">Adresse de livraison du projet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_livraison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de livraison</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type de livraison" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Boomtruck">Boomtruck</SelectItem>
                        <SelectItem value="Flatbed">Flatbed</SelectItem>
                        <SelectItem value="Moffet">Moffet</SelectItem>
                        <SelectItem value="Camion_Cube">Camion_Cube</SelectItem>
                        <SelectItem value="Non Applicable">Non Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

<FormField
  control={form.control}
  name="date_livraison_souhaitee"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date de livraison souhaitée</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal",
              !field.value && "text-muted-foreground"
              )}
            >
              {field.value? (
                format(new Date(field.value), "P", { locale: ca }) // Display with date-fns
              ): (
                <span>Sélectionner une date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            // Use parse to safely convert the string to a Date object:
            selected={field.value? new Date(field.value): undefined}
            onSelect={(date) => {
              if (date) {
                // Format consistently as YYYY-MM-DD:
                const formattedDate = format(date, 'yyyy-MM-dd');
                field.onChange(formattedDate); // Store as YYYY-MM-DD
              }
            }}
            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>

              {initialData?.id && (
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Brouillon">Brouillon</SelectItem>
                          <SelectItem value="En Attente">En Attente</SelectItem>
                          <SelectItem value="Approuvé">Approuvé</SelectItem>
                          <SelectItem value="Refusé">Refusé</SelectItem>
                          <SelectItem value="Complet">Complet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Articles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total estimé: {totalEstime.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentLines = form.getValues("lignes");
                form.setValue("lignes", [
                  ...currentLines,
                  {
                    description_article: "",
                    quantite: 1,
                    prix_unitaire_estime: 0,
                    commentaire_ligne: "",
                    id_activite: "",
                  },
                ]);
              }}
            >
              Ajouter un article
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.watch("lignes").map((ligne, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.description_article`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="resize-vertical min-h-[100px]"
                                placeholder="Description détaillée de l'article..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.quantite`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-20" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.prix_unitaire_estime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-28"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lignes.${index}.id_activite`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Combobox
                                items={activities.map(activity => ({
                                  value: activity.id,
                                  label: `${activity.numero_activite} - ${activity.description_fr}`
                                }))}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Veuillez sélectionner une activité"
                                searchPlaceholder="Rechercher une activité..."
                                emptyText="Aucune activité trouvée."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {((form.watch(`lignes.${index}.prix_unitaire_estime`) || 0) *
                        form.watch(`lignes.${index}.quantite`)).toLocaleString(
                        "fr-CA",
                        {
                          style: "currency",
                          currency: "CAD",
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentLines = form.getValues("lignes");
                            form.setValue(
                              "lignes",
                              currentLines.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pièces justificatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.watch("pieces_jointes")?.map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`pieces_jointes.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="flex-">
                        <FormControl>
                          <Input {...field} placeholder="Type de document" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`pieces_jointes.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="URL du document" type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const currentAttachments = form.getValues("pieces_jointes") || [];
                      form.setValue(
                        "pieces_jointes",
                        currentAttachments.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentAttachments = form.getValues("pieces_jointes") || [];
                  form.setValue("pieces_jointes", [
                    ...currentAttachments,
                    { type: "", url: "" },
                  ]);
                }}
              >
                Ajouter une pièce jointe
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              initialData ? "Mettre à jour" : "Créer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
