-- CreateTable
CREATE TABLE "pieces_jointes" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "id_demande_achat" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pieces_jointes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pieces_jointes_id_demande_achat_idx" ON "pieces_jointes"("id_demande_achat");

-- AddForeignKey
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_id_demande_achat_fkey" FOREIGN KEY ("id_demande_achat") REFERENCES "demandes_achat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
