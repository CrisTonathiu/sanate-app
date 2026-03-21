/*
  Warnings:

  - You are about to drop the column `gramsPerEquivalent` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `calories` on the `FoodGroup` table. All the data in the column will be lost.
  - You are about to drop the column `carbs` on the `FoodGroup` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `FoodGroup` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `FoodGroup` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `RecipeIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `RecipeIngredient` table. All the data in the column will be lost.
  - Added the required column `grams` to the `RecipeIngredient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Food" DROP COLUMN "gramsPerEquivalent",
ADD COLUMN     "caloriesPer100g" DOUBLE PRECISION,
ADD COLUMN     "carbsPer100g" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "density" DOUBLE PRECISION,
ADD COLUMN     "fatPer100g" DOUBLE PRECISION,
ADD COLUMN     "proteinPer100g" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FoodGroup" DROP COLUMN "calories",
DROP COLUMN "carbs",
DROP COLUMN "fat",
DROP COLUMN "protein",
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecipeIngredient" DROP COLUMN "quantity",
DROP COLUMN "unit",
ADD COLUMN     "grams" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "FoodEquivalent" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "equivalentFoodId" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "displayText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodEquivalent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodEquivalent_foodId_idx" ON "FoodEquivalent"("foodId");

-- AddForeignKey
ALTER TABLE "FoodEquivalent" ADD CONSTRAINT "FoodEquivalent_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEquivalent" ADD CONSTRAINT "FoodEquivalent_equivalentFoodId_fkey" FOREIGN KEY ("equivalentFoodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
