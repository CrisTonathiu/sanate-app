-- AlterTable
ALTER TABLE "Food" ADD COLUMN "gramsPerPiece" DOUBLE PRECISION;

-- Grocery size for the catalog example (160 kcal/100g × 200 g = 320 kcal)
UPDATE "Food"
SET "isDiscrete" = true, "gramsPerPiece" = 200
WHERE name = 'Aguacate';

