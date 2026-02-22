-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "enquiries" (
    "id" SERIAL NOT NULL,
    "enquiryNo" TEXT NOT NULL,
    "clientId" INTEGER,
    "clientName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "locationPreference" TEXT,
    "requirementNotes" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "source" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "lostReason" TEXT,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "bookingId" INTEGER,
    "assignedToId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_activities" (
    "id" SERIAL NOT NULL,
    "enquiryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiryNo_key" ON "enquiries"("enquiryNo");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_bookingId_key" ON "enquiries"("bookingId");

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_activities" ADD CONSTRAINT "enquiry_activities_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_activities" ADD CONSTRAINT "enquiry_activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
