-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
PRAGMA foreign_keys=on;
