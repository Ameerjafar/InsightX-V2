-- DropForeignKey
ALTER TABLE "ExistingTrades" DROP CONSTRAINT "ExistingTrades_userId_fkey";

-- AlterTable
ALTER TABLE "ExistingTrades" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ExistingTrades" ADD CONSTRAINT "ExistingTrades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
