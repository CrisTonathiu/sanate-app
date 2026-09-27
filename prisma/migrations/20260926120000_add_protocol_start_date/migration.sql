-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing protocols started when they were created (best available value)
UPDATE "Protocol" SET "startDate" = "createdAt";

-- Enforce a single ACTIVE protocol per patient: keep the newest, complete the rest
UPDATE "Protocol" p
SET "status" = 'COMPLETED'
WHERE p."status" = 'ACTIVE'
  AND p."patientId" IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM "Protocol" newer
      WHERE newer."patientId" = p."patientId"
        AND newer."status" = 'ACTIVE'
        AND (newer."createdAt" > p."createdAt"
             OR (newer."createdAt" = p."createdAt" AND newer."id" > p."id"))
  );
