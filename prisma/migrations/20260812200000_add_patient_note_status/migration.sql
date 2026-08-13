-- CreateEnum
CREATE TYPE "PatientNoteStatus" AS ENUM ('DRAFT', 'SAVED');

-- AlterTable
ALTER TABLE "PatientNote" ADD COLUMN "status" "PatientNoteStatus" NOT NULL DEFAULT 'SAVED';
