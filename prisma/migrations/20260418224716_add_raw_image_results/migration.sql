-- CreateEnum
CREATE TYPE "AnalysisGraphType" AS ENUM ('HEIGHT_DISTRIBUTION', 'DENSITY_VS_AREA');

-- CreateTable
CREATE TABLE "RawImageResult" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" UUID NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RawImageResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultMethod" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "resultId" UUID NOT NULL,

    CONSTRAINT "ResultMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultGraph" (
    "id" UUID NOT NULL,
    "type" "AnalysisGraphType" NOT NULL,
    "resultId" UUID NOT NULL,

    CONSTRAINT "ResultGraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphPoint" (
    "id" UUID NOT NULL,
    "idx" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "graphId" UUID NOT NULL,

    CONSTRAINT "GraphPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawImageResult_imageId_key" ON "RawImageResult"("imageId");

-- CreateIndex
CREATE INDEX "ResultMethod_resultId_idx" ON "ResultMethod"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultGraph_resultId_type_key" ON "ResultGraph"("resultId", "type");

-- CreateIndex
CREATE INDEX "GraphPoint_graphId_idx_idx" ON "GraphPoint"("graphId", "idx");

-- AddForeignKey
ALTER TABLE "RawImageResult" ADD CONSTRAINT "RawImageResult_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "RawImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultMethod" ADD CONSTRAINT "ResultMethod_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "RawImageResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultGraph" ADD CONSTRAINT "ResultGraph_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "RawImageResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphPoint" ADD CONSTRAINT "GraphPoint_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "ResultGraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;
