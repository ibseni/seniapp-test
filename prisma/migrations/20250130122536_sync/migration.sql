/*
  Warnings:

  - You are about to drop the column `date_livraison_souhaitee` on the `lignes_demande_achat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bons_commande" ADD COLUMN     "date_livraison" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "demandes_achat" ADD COLUMN     "date_livraison_souhaitee" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "lignes_demande_achat" DROP COLUMN "date_livraison_souhaitee";
