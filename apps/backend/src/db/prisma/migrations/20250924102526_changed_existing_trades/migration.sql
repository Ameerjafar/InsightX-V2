/*
  Warnings:

  - You are about to drop the column `closePrice` on the `ExistingTrades` table. All the data in the column will be lost.
  - You are about to drop the column `openPrice` on the `ExistingTrades` table. All the data in the column will be lost.
  - You are about to drop the column `pnl` on the `ExistingTrades` table. All the data in the column will be lost.
  - Made the column `userId` on table `ExistingTrades` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ExistingTrades" DROP CONSTRAINT "ExistingTrades_userId_fkey";

-- AlterTable
ALTER TABLE "ExistingTrades" DROP COLUMN "closePrice",
DROP COLUMN "openPrice",
DROP COLUMN "pnl",
ALTER COLUMN "leverage" DROP NOT NULL,
ALTER COLUMN "liquidated" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ExistingTrades" ADD CONSTRAINT "ExistingTrades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
