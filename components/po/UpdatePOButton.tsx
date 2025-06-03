"use client";

import { editPO } from "@/app/serverActions/po/editPO";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
} from "../ui/alert-dialog";

export const UpdatePOButton = ({
  po_id,
  pr_id,
  po_status,
}: {
  po_id: string;
  pr_id: string;
  pr_status: string;
  po_status: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [state, formAction] = useFormState(
    editPO,
    {} as { success: false; redirectTo: string | null }
  );
  const form = useFormStatus();

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(`/achats/pr/${state.redirectTo}/edit`);
    }
  }, [state?.success, state?.redirectTo, form]);

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="submit"
            disabled={
              loading || po_status === "En révision" || po_status === "Annulé"
            }
          >
            {loading
              ? "Veuillez patienter..."
              : po_status === "En révision"
              ? "En révision"
              : "Modifier"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le bon de commande sera
              marqué comme en révision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <form action={formAction} onSubmit={() => setLoading(true)}>
              <input type="text" hidden name="po_id" defaultValue={po_id} />
              <input type="text" hidden name="pr_id" defaultValue={pr_id} />
              <input
                type="text"
                hidden
                name="currentPO_status"
                defaultValue={po_status}
              />
              <AlertDialogAction type="submit">Confirmer</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
