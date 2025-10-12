/*
  Warnings:

  - Added the required column `slippage` to the `ExistingTrades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExistingTrades" ADD COLUMN     "slippage" DOUBLE PRECISION NOT NULL;
