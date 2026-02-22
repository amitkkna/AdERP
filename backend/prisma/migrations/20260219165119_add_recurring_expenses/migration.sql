-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" SERIAL NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" INTEGER NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
