-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'MUNICIPAL_TAX', 'ELECTRICITY', 'MAINTENANCE', 'INSURANCE', 'PERMISSION_FEE', 'CONSTRUCTION', 'INSTALLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('CAPEX', 'OPEX');

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "type" "ExpenseType" NOT NULL DEFAULT 'OPEX',
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" INTEGER NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
