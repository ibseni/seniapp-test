"use client";

import { Button } from "@/components/ui/button";
import { cancelPO } from "@/app/serverActions/po/cancelPO";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CancelPOButtonProps {
  numero_bon_commande: string;
  userEmail: string;
}

export function CancelPOButton({
  numero_bon_commande,
  userEmail,
}: CancelPOButtonProps) {
  const router = useRouter();

  const handleCancel = async () => {
    try {
      const result = await cancelPO(numero_bon_commande, userEmail);

      if (result.success) {
        toast.success("Bon de commande annulé avec succès");
        router.refresh();
      } else {
        toast.error("Erreur lors de l'annulation du bon de commande");
      }
    } catch (error) {
      console.error("Error canceling PO:", error);
      toast.error("Erreur lors de l'annulation du bon de commande");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="h-[50px]" variant="destructive">
          Annuler le bon de commande
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action ne peut pas être annulée. Le bon de commande sera
            marqué comme annulé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
