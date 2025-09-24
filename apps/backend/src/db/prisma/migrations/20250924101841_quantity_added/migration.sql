/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quantity` to the `ExistingTrades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ExistingTrades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExistingTrades" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
