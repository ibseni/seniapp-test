import { PurchaseRequestForm } from "@/components/pr/PurchaseRequestForm";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getPurchaseRequest } from "@/app/serverActions/pr/getPurchaseRequest";
import { getFormData } from "@/app/serverActions/pr/getFormData";
import { z } from "zod";

interface EditPurchaseRequestPageProps {
  params: {
    numero_demande: string;
  };
}

const lineItemSchema = z.object({
  id: z.string().optional(),
  description_article: z.string().min(1),
  quantite: z.number().min(1),
  prix_unitaire_estime: z.number().min(0.01),
  commentaire_ligne: z.string().optional(),
  id_activite: z.string().min(1),
});

const attachmentSchema = z.object({
  type: z.string().min(1),
  url: z.string().url(),
});

const formSchema = z.object({
  id: z.string().optional(),
  id_projet: z.string({ required_error: "Le projet est requis" }).min(1, "Le projet est requis"),
  demandeur: z.string().optional(),
  statut: z.string().optional(),
  commentaire: z.string().optional(),
  date_livraison_souhaitee: z.string().min(1, "La date de livraison est requise"),
  id_fournisseur: z.string({ required_error: "Le fournisseur est requis" }).min(1, "Le fournisseur est requis"),
  delivery_option: z.enum(["pickup", "siege_social", "projet"], {
    required_error: "L'option de livraison est requise",
  }),
  relation_compagnie: z.enum(["fournisseur", "sous-traitant"], {
    required_error: "La relation est requise",
  }),
  type_livraison: z.enum(["Boomtruck", "Flatbed", "Moffet"]).default("Flatbed"),
  lignes: z.array(lineItemSchema).min(1, "Au moins une ligne est requise"),
  pieces_jointes: z.array(attachmentSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

type DeliveryOption = "pickup" | "siege_social" | "projet";
type TypeLivraison = "Boomtruck" | "Flatbed" | "Moffet";
type RelationCompagnie = "fournisseur" | "sous-traitant";

type PurchaseRequest = {
  id: string;
  numero_demande_achat: string;
  id_projet: string;
  demandeur: string | null;
  statut: string | null;
  commentaire: string | null;
  id_fournisseur: string;
  total_estime: number | null;
  date_creation: Date;
  date_modification: Date;
  date_livraison_souhaitee: Date | null;
  delivery_option: DeliveryOption;
  relation_compagnie: RelationCompagnie;
  type_livraison: TypeLivraison;
  lignes: {
    id: string;
    description_article: string;
    quantite: number;
    prix_unitaire_estime: number;
    commentaire_ligne: string | null;
    id_activite: string | null;
    activite: {
      id: string;
      numero_activite: string;
      description_fr: string;
      description_en: string;
    } | null;
  }[];
  pieces_jointes: {
    id: string;
    type: string;
    url: string;
  }[];
};

export default async function EditPurchaseRequestPage({
  params,
}: {
  params: Promise<{ numero_demande: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [prResult, formDataResult] = await Promise.all([
    getPurchaseRequest(resolvedParams.numero_demande),
    getFormData(),
  ]);

  if (!prResult.success || !prResult.data) {
    notFound();
  }

  if (!formDataResult.success || !formDataResult.data) {
    throw new Error(formDataResult.error || "Failed to load form data");
  }

  const pr = prResult.data as unknown as PurchaseRequest;
  const { projects, suppliers, activities } = formDataResult.data;

  // Prevent editing of approved purchase requests
  if (pr.statut === "Approuvé") {
    redirect(`/achats/pr/${pr.numero_demande_achat}`);
  }

  // Ensure required fields are present
  if (!pr.id_projet || !pr.id_fournisseur) {
    throw new Error("Purchase request is missing required fields");
  }

  // Format the PR data for the form
  const formattedPr: FormData & { numero_demande_achat: string } = {
    id: pr.id,
    numero_demande_achat: pr.numero_demande_achat,
    demandeur: pr.demandeur || user.email,
    statut: pr.statut || "Brouillon",
    commentaire: pr.commentaire || "",

    id_projet: pr.id_projet,
    id_fournisseur: pr.id_fournisseur,
    delivery_option: (pr.delivery_option ?? "pickup") as "pickup" | "siege_social" | "projet",
    type_livraison: (pr.type_livraison ?? "Flatbed") as "Boomtruck" | "Flatbed" | "Moffet",
    relation_compagnie: (pr.relation_compagnie ?? "fournisseur") as "fournisseur" | "sous-traitant",
    date_livraison_souhaitee: pr.date_livraison_souhaitee ? 
      new Date(pr.date_livraison_souhaitee).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    lignes: pr.lignes.map((ligne) => {
      if (!ligne.id_activite) {
        throw new Error("Line item is missing required activity");
      }
      if (ligne.prix_unitaire_estime === null) {
        throw new Error("Line item is missing required unit price");
      }
      return {
        id: ligne.id,
        description_article: ligne.description_article,
        quantite: ligne.quantite,
        prix_unitaire_estime: ligne.prix_unitaire_estime,
        commentaire_ligne: ligne.commentaire_ligne || "",
        id_activite: ligne.id_activite,
      };
    }),
    pieces_jointes: pr.pieces_jointes?.map(piece => ({
      type: piece.type,
      url: piece.url,
    })) || [],
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier la demande d&apos;achat
        </h1>
        <PurchaseRequestForm
          initialData={formattedPr}
          projects={projects}
          suppliers={suppliers}
          activities={activities}
          user={{ email: user.email || "" }}
        />
      </div>
    </div>
  );
} 