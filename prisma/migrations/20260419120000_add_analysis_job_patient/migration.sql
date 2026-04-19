-- AlterTable: add patientId as nullable, backfill, then enforce NOT NULL
ALTER TABLE "AnalysisJob" ADD COLUMN "patientId" UUID;

UPDATE "AnalysisJob" SET "patientId" = "creatorId" WHERE "patientId" IS NULL;

ALTER TABLE "AnalysisJob" ALTER COLUMN "patientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AnalysisJob_patientId_updatedAt_idx" ON "AnalysisJob"("patientId", "updatedAt" DESC);
