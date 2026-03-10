/*
  Warnings:

  - You are about to drop the column `consultationId` on the `Protocol` table. All the data in the column will be lost.
  - You are about to drop the column `isTemplate` on the `Protocol` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Protocol" DROP CONSTRAINT "Protocol_consultationId_fkey";

-- AlterTable
ALTER TABLE "Protocol" DROP COLUMN "consultationId",
DROP COLUMN "isTemplate",
ADD COLUMN     "status" "ProtocolStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "ProtocolRevision" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "consultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolRevision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProtocolRevision" ADD CONSTRAINT "ProtocolRevision_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolRevision" ADD CONSTRAINT "ProtocolRevision_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
