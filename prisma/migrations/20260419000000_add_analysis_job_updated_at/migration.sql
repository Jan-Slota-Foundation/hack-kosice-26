-- AlterTable
ALTER TABLE "AnalysisJob" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "AnalysisJob_creatorId_createdAt_idx";

-- CreateIndex
CREATE INDEX "AnalysisJob_creatorId_updatedAt_idx" ON "AnalysisJob"("creatorId", "updatedAt" DESC);
