-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PROCESSING', 'FINISHED', 'ERROR');

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "creatorId" UUID NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawImage" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "jobId" UUID NOT NULL,

    CONSTRAINT "RawImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisJob_creatorId_createdAt_idx" ON "AnalysisJob"("creatorId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RawImage_storagePath_key" ON "RawImage"("storagePath");

-- CreateIndex
CREATE INDEX "RawImage_userId_idx" ON "RawImage"("userId");

-- CreateIndex
CREATE INDEX "RawImage_jobId_idx" ON "RawImage"("jobId");

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawImage" ADD CONSTRAINT "RawImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawImage" ADD CONSTRAINT "RawImage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AnalysisJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
