"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { updateSendStatus } from "@/app/serverActions/po/updatePOSendStatus";

export default function ConfirmPOSentButtonClient({
  sent,
  id,
  status,
}: {
  sent: boolean;
  id: string;
  status: string;
}) {
  const [isSent, setIsSent] = useState<boolean>(sent);

  return (
    <form action={updateSendStatus} onSubmit={() => setIsSent(true)}>
      <Button
        className={`${
          isSent ? " bg-green-600 text-green-100" : "bg-orange-400 text-white"
        }`} // Changed to bg-orange-400 and added text-white for better contrast
        type="submit"
        disabled={isSent || status === "En révision" || status === "Annulé"}
      >
        {isSent
          ? "Bon de commande envoyé"
          : "Confirmer l'envoi du bon de commande"}
      </Button>
      <input type="text" name="id" defaultValue={id} hidden />
    </form>
  );
}
