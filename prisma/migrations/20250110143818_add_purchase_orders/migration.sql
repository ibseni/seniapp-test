-- CreateTable
CREATE TABLE "articles" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "views" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,

    CONSTRAINT "views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "numero_projet" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "addresse" TEXT NOT NULL,
    "addresseLivraison" TEXT,
    "id_dossier_commande" TEXT,
    "surintendant" TEXT,
    "coordonateur_projet" TEXT,
    "charge_de_projet" TEXT,
    "directeur_de_projet" TEXT,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "numero_fournisseur" TEXT NOT NULL,
    "nom_fournisseur" TEXT,
    "adresse_ligne1" TEXT,
    "ville" TEXT,
    "code_postal" TEXT,
    "telephone1" TEXT,
    "poste_telephone1" TEXT,
    "telephone2" TEXT,
    "telecopieur" TEXT,
    "telephone_autre" TEXT,
    "nom_responsable" TEXT,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_achat" (
    "id" TEXT NOT NULL,
    "numero_demande_achat" TEXT NOT NULL,
    "id_projet" TEXT,
    "demandeur" TEXT,
    "statut" TEXT,
    "commentaire" TEXT,
    "id_fournisseur" TEXT,
    "total_estime" DOUBLE PRECISION DEFAULT 0,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_demande_achat" (
    "id" TEXT NOT NULL,
    "id_demande_achat" TEXT NOT NULL,
    "description_article" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire_estime" DOUBLE PRECISION NOT NULL,
    "date_livraison_souhaitee" TIMESTAMP(3),
    "commentaire_ligne" TEXT,
    "id_activite" TEXT,

    CONSTRAINT "lignes_demande_achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "numero_activite" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "description_fr" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "code_interne" TEXT,
    "numero_fournisseur" TEXT,
    "numero_gl_achat" TEXT,

    CONSTRAINT "activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_demande_achat" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "email_utilisateur" TEXT NOT NULL,
    "id_bon_commande" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bons_commande" (
    "id" TEXT NOT NULL,
    "numero_bon_commande" TEXT NOT NULL,
    "id_demande_achat" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'En cours',
    "commentaire" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "bons_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_bon_commande" (
    "id" TEXT NOT NULL,
    "id_bon_commande" TEXT NOT NULL,
    "id_ligne_demande" TEXT NOT NULL,
    "description_article" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(65,30) NOT NULL,
    "date_livraison" TIMESTAMP(3),
    "commentaire" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lignes_bon_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_rolesTousers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_rolesTousers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_permissionsToroles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_permissionsToroles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "projets_numero_projet_key" ON "projets"("numero_projet");

-- CreateIndex
CREATE UNIQUE INDEX "fournisseurs_numero_fournisseur_key" ON "fournisseurs"("numero_fournisseur");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_achat_numero_demande_achat_key" ON "demandes_achat"("numero_demande_achat");

-- CreateIndex
CREATE INDEX "demandes_achat_id_projet_idx" ON "demandes_achat"("id_projet");

-- CreateIndex
CREATE INDEX "demandes_achat_id_fournisseur_idx" ON "demandes_achat"("id_fournisseur");

-- CreateIndex
CREATE INDEX "lignes_demande_achat_id_demande_achat_idx" ON "lignes_demande_achat"("id_demande_achat");

-- CreateIndex
CREATE INDEX "lignes_demande_achat_id_activite_idx" ON "lignes_demande_achat"("id_activite");

-- CreateIndex
CREATE UNIQUE INDEX "activites_numero_activite_key" ON "activites"("numero_activite");

-- CreateIndex
CREATE INDEX "audit_logs_id_demande_achat_idx" ON "audit_logs"("id_demande_achat");

-- CreateIndex
CREATE INDEX "audit_logs_id_bon_commande_idx" ON "audit_logs"("id_bon_commande");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_key" ON "permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bons_commande_numero_bon_commande_key" ON "bons_commande"("numero_bon_commande");

-- CreateIndex
CREATE INDEX "bons_commande_id_demande_achat_idx" ON "bons_commande"("id_demande_achat");

-- CreateIndex
CREATE INDEX "lignes_bon_commande_id_bon_commande_idx" ON "lignes_bon_commande"("id_bon_commande");

-- CreateIndex
CREATE INDEX "lignes_bon_commande_id_ligne_demande_idx" ON "lignes_bon_commande"("id_ligne_demande");

-- CreateIndex
CREATE INDEX "_rolesTousers_B_index" ON "_rolesTousers"("B");

-- CreateIndex
CREATE INDEX "_permissionsToroles_B_index" ON "_permissionsToroles"("B");

-- AddForeignKey
ALTER TABLE "demandes_achat" ADD CONSTRAINT "demandes_achat_id_projet_fkey" FOREIGN KEY ("id_projet") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_achat" ADD CONSTRAINT "demandes_achat_id_fournisseur_fkey" FOREIGN KEY ("id_fournisseur") REFERENCES "fournisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_demande_achat" ADD CONSTRAINT "lignes_demande_achat_id_demande_achat_fkey" FOREIGN KEY ("id_demande_achat") REFERENCES "demandes_achat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_demande_achat" ADD CONSTRAINT "lignes_demande_achat_id_activite_fkey" FOREIGN KEY ("id_activite") REFERENCES "activites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_id_demande_achat_fkey" FOREIGN KEY ("id_demande_achat") REFERENCES "demandes_achat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_id_bon_commande_fkey" FOREIGN KEY ("id_bon_commande") REFERENCES "bons_commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bons_commande" ADD CONSTRAINT "bons_commande_id_demande_achat_fkey" FOREIGN KEY ("id_demande_achat") REFERENCES "demandes_achat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_bon_commande" ADD CONSTRAINT "lignes_bon_commande_id_bon_commande_fkey" FOREIGN KEY ("id_bon_commande") REFERENCES "bons_commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_bon_commande" ADD CONSTRAINT "lignes_bon_commande_id_ligne_demande_fkey" FOREIGN KEY ("id_ligne_demande") REFERENCES "lignes_demande_achat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_rolesTousers" ADD CONSTRAINT "_rolesTousers_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_rolesTousers" ADD CONSTRAINT "_rolesTousers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsToroles" ADD CONSTRAINT "_permissionsToroles_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsToroles" ADD CONSTRAINT "_permissionsToroles_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
