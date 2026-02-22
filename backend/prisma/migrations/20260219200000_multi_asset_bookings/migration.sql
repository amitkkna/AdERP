-- CreateTable: BookingAsset junction table
CREATE TABLE "booking_assets" (
    "id" SERIAL NOT NULL,
    "monthlyRate" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,

    CONSTRAINT "booking_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint (one asset per booking)
CREATE UNIQUE INDEX "booking_assets_bookingId_assetId_key" ON "booking_assets"("bookingId", "assetId");

-- AddForeignKey: bookingId -> bookings (cascade delete)
ALTER TABLE "booking_assets" ADD CONSTRAINT "booking_assets_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: assetId -> assets
ALTER TABLE "booking_assets" ADD CONSTRAINT "booking_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateData: copy existing booking assetId + monthlyRate into booking_assets
INSERT INTO "booking_assets" ("bookingId", "assetId", "monthlyRate", "createdAt")
SELECT "id", "assetId", "monthlyRate", "createdAt"
FROM "bookings"
WHERE "assetId" IS NOT NULL;

-- DropForeignKey: remove old assetId FK from bookings
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_assetId_fkey";

-- AlterTable: drop old columns from bookings
ALTER TABLE "bookings" DROP COLUMN "assetId";
ALTER TABLE "bookings" DROP COLUMN "monthlyRate";
