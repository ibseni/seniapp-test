/*
  Warnings:

  - Made the column `delivery_option` on table `demandes_achat` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DeliveryOption" AS ENUM ('pickup', 'siege_social', 'projet');

-- AlterTable
ALTER TABLE "demandes_achat" ALTER COLUMN "delivery_option" SET NOT NULL;
