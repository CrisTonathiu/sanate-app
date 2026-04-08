/*
  Warnings:

  - The values [SNACK] on the enum `MealType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MealType_new" AS ENUM ('SMOOTHIE', 'BREAKFAST', 'SNACK1', 'SNACK2', 'LUNCH', 'DINNER', 'DRINKS');
ALTER TABLE "Recipe" ALTER COLUMN "mealType" TYPE "MealType_new" USING ("mealType"::text::"MealType_new");
ALTER TABLE "ProtocolMeal" ALTER COLUMN "mealType" TYPE "MealType_new" USING ("mealType"::text::"MealType_new");
ALTER TYPE "MealType" RENAME TO "MealType_old";
ALTER TYPE "MealType_new" RENAME TO "MealType";
DROP TYPE "public"."MealType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "isDiscrete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPortionGrams" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ProtocolMealPortions" (
    "id" TEXT NOT NULL,
    "protocolMealId" TEXT NOT NULL,
    "targetCalories" DOUBLE PRECISION NOT NULL,
    "targetProtein" DOUBLE PRECISION NOT NULL,
    "targetCarbs" DOUBLE PRECISION NOT NULL,
    "targetFat" DOUBLE PRECISION NOT NULL,
    "actualCalories" DOUBLE PRECISION NOT NULL,
    "actualProtein" DOUBLE PRECISION NOT NULL,
    "actualCarbs" DOUBLE PRECISION NOT NULL,
    "actualFat" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolMealPortions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolMealIngredient" (
    "id" TEXT NOT NULL,
    "portionsId" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "unit" "IngredientUnit" NOT NULL DEFAULT 'GRAM',
    "baseQuantity" DOUBLE PRECISION NOT NULL,
    "targetQuantity" DOUBLE PRECISION NOT NULL,
    "baseGrams" DOUBLE PRECISION NOT NULL,
    "targetGrams" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProtocolMealIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolMealPortions_protocolMealId_key" ON "ProtocolMealPortions"("protocolMealId");

-- CreateIndex
CREATE INDEX "ProtocolMealPortions_protocolMealId_idx" ON "ProtocolMealPortions"("protocolMealId");

-- CreateIndex
CREATE INDEX "ProtocolMealIngredient_portionsId_idx" ON "ProtocolMealIngredient"("portionsId");

-- AddForeignKey
ALTER TABLE "ProtocolMealPortions" ADD CONSTRAINT "ProtocolMealPortions_protocolMealId_fkey" FOREIGN KEY ("protocolMealId") REFERENCES "ProtocolMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolMealIngredient" ADD CONSTRAINT "ProtocolMealIngredient_portionsId_fkey" FOREIGN KEY ("portionsId") REFERENCES "ProtocolMealPortions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
