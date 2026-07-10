-- AlterTable
ALTER TABLE "PatientNote" ADD COLUMN "transcript" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PatientNote_patientId_idx" ON "PatientNote"("patientId");
