/*
  Warnings:

  - You are about to drop the column `allergen` on the `PatientAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `PatientCondition` table. All the data in the column will be lost.
  - Added the required column `nutritionistId` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `allergenId` to the `PatientAllergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionId` to the `PatientCondition` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'SNACK', 'LUNCH', 'DINNER');

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "nutritionistId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PatientAllergy" DROP COLUMN "allergen",
ADD COLUMN     "allergenId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PatientCondition" DROP COLUMN "name",
ADD COLUMN     "conditionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientEquivalent" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "equivalentId" TEXT NOT NULL,

    CONSTRAINT "IngredientEquivalent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolWeek" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,

    CONSTRAINT "ProtocolWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,

    CONSTRAINT "ProtocolDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolMeal" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "recipeId" TEXT,

    CONSTRAINT "ProtocolMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "patientId" TEXT,
    "consultationId" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "weekCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condition_name_key" ON "Condition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- AddForeignKey
ALTER TABLE "PatientCondition" ADD CONSTRAINT "PatientCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientEquivalent" ADD CONSTRAINT "IngredientEquivalent_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientEquivalent" ADD CONSTRAINT "IngredientEquivalent_equivalentId_fkey" FOREIGN KEY ("equivalentId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolWeek" ADD CONSTRAINT "ProtocolWeek_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolDay" ADD CONSTRAINT "ProtocolDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProtocolWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolMeal" ADD CONSTRAINT "ProtocolMeal_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProtocolDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolMeal" ADD CONSTRAINT "ProtocolMeal_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocol" ADD CONSTRAINT "Protocol_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocol" ADD CONSTRAINT "Protocol_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
