-- CreateTable
CREATE TABLE "PatientFoodDislike" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientFoodDislike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientFoodDislike_patientId_idx" ON "PatientFoodDislike"("patientId");

-- CreateIndex
CREATE INDEX "PatientFoodDislike_foodId_idx" ON "PatientFoodDislike"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientFoodDislike_patientId_foodId_key" ON "PatientFoodDislike"("patientId", "foodId");

-- AddForeignKey
ALTER TABLE "PatientFoodDislike" ADD CONSTRAINT "PatientFoodDislike_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFoodDislike" ADD CONSTRAINT "PatientFoodDislike_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
