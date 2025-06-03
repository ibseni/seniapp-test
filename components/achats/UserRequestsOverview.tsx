"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

interface PurchaseRequest {
  id: string;
  numero_demande_achat: string;
  statut: string | null;
  date_creation: Date;
  projet: {
    numero_projet: string;
    nom: string;
  } | null;
  fournisseur: {
    numero_fournisseur: string;
    nom_fournisseur: string | null;
  } | null;
}

interface PurchaseOrder {
  id: string;
  numero_bon_commande: string;
  statut: string;
  total: number;
  date_creation: Date;
  demande_achat: {
    numero_demande_achat: string;
    projet: {
      numero_projet: string;
      nom: string;
    } | null;
    fournisseur: {
      numero_fournisseur: string;
      nom_fournisseur: string | null;
    } | null;
  };
}

interface UserRequestsOverviewProps {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
}

export function UserRequestsOverview({ purchaseRequests, purchaseOrders }: UserRequestsOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Purchase Requests Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes demandes d'achat récentes</CardTitle>
            <Link href="/achats/pr">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{request.numero_demande_achat}</div>
                        <Badge
                          variant={
                            request.statut === "Approuvé"
                              ? "default"
                              : request.statut === "Rejeté"
                              ? "destructive"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {request.statut}
                        </Badge>
                      </div>
                      <Link href={`/achats/pr/${request.numero_demande_achat}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {request.projet && (
                      <div>
                        <div className="text-sm text-muted-foreground">Projet</div>
                        <div className="font-medium">{request.projet.numero_projet}</div>
                        <div className="text-sm text-muted-foreground">{request.projet.nom}</div>
                      </div>
                    )}

                    {request.fournisseur && (
                      <div>
                        <div className="text-sm text-muted-foreground">Fournisseur</div>
                        <div className="font-medium">{request.fournisseur.numero_fournisseur}</div>
                        <div className="text-sm text-muted-foreground">{request.fournisseur.nom_fournisseur}</div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Créé le {formatDate(request.date_creation)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {purchaseRequests.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Aucune demande d'achat récente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes bons de commande récents</CardTitle>
            <Link href="/achats/po">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{order.numero_bon_commande}</div>
                        <div className="text-sm text-muted-foreground">
                          DA: {order.demande_achat.numero_demande_achat}
                        </div>
                        <Badge
                          variant={
                            order.statut === "Approuvé"
                              ? "default"
                              : order.statut === "Rejeté"
                              ? "destructive"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {order.statut}
                        </Badge>
                      </div>
                      <Link href={`/achats/po/${order.numero_bon_commande}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {order.demande_achat.projet && (
                      <div>
                        <div className="text-sm text-muted-foreground">Projet</div>
                        <div className="font-medium">{order.demande_achat.projet.numero_projet}</div>
                        <div className="text-sm text-muted-foreground">{order.demande_achat.projet.nom}</div>
                      </div>
                    )}

                    {order.demande_achat.fournisseur && (
                      <div>
                        <div className="text-sm text-muted-foreground">Fournisseur</div>
                        <div className="font-medium">{order.demande_achat.fournisseur.numero_fournisseur}</div>
                        <div className="text-sm text-muted-foreground">{order.demande_achat.fournisseur.nom_fournisseur}</div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div>Créé le {formatDate(order.date_creation)}</div>
                      <div className="font-medium">
                        {order.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {purchaseOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Aucun bon de commande récent
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 