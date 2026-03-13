/*
  Warnings:

  - You are about to drop the `IngredientEquivalent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IngredientEquivalent" DROP CONSTRAINT "IngredientEquivalent_equivalentId_fkey";

-- DropForeignKey
ALTER TABLE "IngredientEquivalent" DROP CONSTRAINT "IngredientEquivalent_ingredientId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "foodId" TEXT;

-- DropTable
DROP TABLE "IngredientEquivalent";

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "gramsPerEquivalent" DOUBLE PRECISION,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carbs" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,

    CONSTRAINT "FoodGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolFoodGroup" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "totalEquivalents" DOUBLE PRECISION NOT NULL,
    "breakfast" DOUBLE PRECISION NOT NULL,
    "snack" DOUBLE PRECISION NOT NULL,
    "lunch" DOUBLE PRECISION NOT NULL,
    "dinner" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProtocolFoodGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FoodGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
