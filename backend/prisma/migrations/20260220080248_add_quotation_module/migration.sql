-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "quotations" (
    "id" SERIAL NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "size" TEXT,
    "monthlyRate" DECIMAL(12,2) NOT NULL,
    "months" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quotationId" INTEGER NOT NULL,
    "assetId" INTEGER,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNo_key" ON "quotations"("quotationNo");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
