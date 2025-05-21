-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
