import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface PODetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  poDetails: any | null;
  isLoading: boolean;
}

export function PODetailsModal({
  isOpen,
  onClose,
  poDetails,
  isLoading
}: PODetailsModalProps) {
  // Format number to 2 decimal places
  const formatNumber = (value: number | null | undefined) => {
    if (value == null) return "0.00";
    return value.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du bon de commande</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : poDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Numéro de bon de commande</h3>
                <p>{poDetails.numero_bon_commande}</p>
              </div>
              <div>
                <h3 className="font-semibold">Date de création</h3>
                <p>{formatDate(poDetails.date_creation)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Statut</h3>
                <p>{poDetails.statut}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total</h3>
                <p>{formatNumber(poDetails.total)} $</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Demande d'achat</h3>
              <p>Numéro: {poDetails.demande_achat?.numero_demande_achat}</p>
              <p>Demandeur: {poDetails.demande_achat?.demandeur}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Projet</h3>
              <p>Numéro: {poDetails.demande_achat?.projet?.numero_projet}</p>
              <p>Nom: {poDetails.demande_achat?.projet?.nom}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Fournisseur</h3>
              <p>Numéro: {poDetails.demande_achat?.fournisseur?.numero_fournisseur}</p>
              <p>Nom: {poDetails.demande_achat?.fournisseur?.nom_fournisseur}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Lignes</h3>
              <div className="border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Activité</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Quantité</th>
                      <th className="px-4 py-2 text-right">Prix unitaire</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {poDetails.lignes?.map((ligne: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{ligne.ligne_demande?.activite?.numero_activite}</td>
                        <td className="px-4 py-2">{ligne.description_article}</td>
                        <td className="px-4 py-2 text-right">{ligne.quantite}</td>
                        <td className="px-4 py-2 text-right">{formatNumber(ligne.prix_unitaire)} $</td>
                        <td className="px-4 py-2 text-right">{formatNumber(ligne.total)} $</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Aucun détail disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 