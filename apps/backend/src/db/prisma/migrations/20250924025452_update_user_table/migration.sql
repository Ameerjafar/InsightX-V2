/*
  Warnings:

  - Added the required column `Balance` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `freeMargin` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lockedMargin` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Balance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "freeMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lockedMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;
