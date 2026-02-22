-- CreateEnum
CREATE TYPE "PDCStatus" AS ENUM ('HELD', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pdcs" (
    "id" SERIAL NOT NULL,
    "chequeNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PDCStatus" NOT NULL DEFAULT 'HELD',
    "depositedDate" TIMESTAMP(3),
    "clearedDate" TIMESTAMP(3),
    "bouncedDate" TIMESTAMP(3),
    "bounceReason" TEXT,
    "penaltyAmount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" INTEGER NOT NULL,

    CONSTRAINT "pdcs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pdcs" ADD CONSTRAINT "pdcs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
