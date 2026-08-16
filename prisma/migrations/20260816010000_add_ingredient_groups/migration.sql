-- CreateTable
CREATE TABLE "IngredientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'violet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientGroupItem" (
    "groupId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,

    CONSTRAINT "IngredientGroupItem_pkey" PRIMARY KEY ("groupId","foodId")
);

-- CreateTable
CREATE TABLE "PatientFoodGroupDislike" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientFoodGroupDislike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngredientGroup_name_idx" ON "IngredientGroup"("name");

-- CreateIndex
CREATE INDEX "IngredientGroupItem_foodId_idx" ON "IngredientGroupItem"("foodId");

-- CreateIndex
CREATE INDEX "PatientFoodGroupDislike_patientId_idx" ON "PatientFoodGroupDislike"("patientId");

-- CreateIndex
CREATE INDEX "PatientFoodGroupDislike_groupId_idx" ON "PatientFoodGroupDislike"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientFoodGroupDislike_patientId_groupId_key" ON "PatientFoodGroupDislike"("patientId", "groupId");

-- AddForeignKey
ALTER TABLE "IngredientGroupItem" ADD CONSTRAINT "IngredientGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngredientGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientGroupItem" ADD CONSTRAINT "IngredientGroupItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFoodGroupDislike" ADD CONSTRAINT "PatientFoodGroupDislike_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFoodGroupDislike" ADD CONSTRAINT "PatientFoodGroupDislike_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngredientGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
