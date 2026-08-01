-- AlterEnum
ALTER TYPE "ProtocolStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN "draftSnapshot" JSONB,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep existing rows consistent with Prisma @updatedAt default
UPDATE "Protocol" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
