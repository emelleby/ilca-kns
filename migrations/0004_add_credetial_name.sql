-- AlterTable
ALTER TABLE "Credential" ADD COLUMN "deviceName" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
PRAGMA foreign_keys=on;
