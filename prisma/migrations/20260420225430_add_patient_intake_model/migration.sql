-- CreateTable
CREATE TABLE "PatientIntake" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'google_form',
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientIntake_pkey" PRIMARY KEY ("id")
);
