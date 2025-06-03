-- AlterTable
ALTER TABLE "bons_commande" ADD COLUMN     "delivery_option" TEXT NOT NULL DEFAULT 'pickup',
ADD COLUMN     "type_livraison" TEXT NOT NULL DEFAULT 'Flatbed';
