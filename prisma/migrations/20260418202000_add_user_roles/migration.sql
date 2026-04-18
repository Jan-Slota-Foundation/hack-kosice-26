-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DOCTOR', 'PATIENT');

-- AlterTable: add role (default PATIENT for future rows) and backfill existing users to DOCTOR
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'PATIENT';
UPDATE "User" SET "role" = 'DOCTOR';

-- AlterTable: add nullable doctorId self-reference
ALTER TABLE "User" ADD COLUMN "doctorId" UUID;

-- CreateIndex
CREATE INDEX "User_doctorId_idx" ON "User"("doctorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
