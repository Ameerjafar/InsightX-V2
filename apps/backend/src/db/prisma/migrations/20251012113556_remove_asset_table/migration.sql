/*
  Warnings:

  - You are about to drop the column `assetId` on the `ExistingTrades` table. All the data in the column will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExistingTrades" DROP CONSTRAINT "ExistingTrades_assetId_fkey";

-- AlterTable
ALTER TABLE "ExistingTrades" DROP COLUMN "assetId";

-- DropTable
DROP TABLE "Asset";
