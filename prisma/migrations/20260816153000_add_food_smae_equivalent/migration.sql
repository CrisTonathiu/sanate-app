-- AlterTable
ALTER TABLE "Food" ADD COLUMN "gramsPerEquivalent" DOUBLE PRECISION,
ADD COLUMN "equivalentDisplayText" TEXT,
ADD COLUMN "isFreePortion" BOOLEAN NOT NULL DEFAULT false;
