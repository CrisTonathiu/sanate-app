-- AlterTable
ALTER TABLE "Food" ADD COLUMN "minPortionQuantity" DOUBLE PRECISION;
ALTER TABLE "Food" ADD COLUMN "minPortionUnit" "IngredientUnit";
ALTER TABLE "Food" ADD COLUMN "maxPortionQuantity" DOUBLE PRECISION;
ALTER TABLE "Food" ADD COLUMN "maxPortionUnit" "IngredientUnit";

-- Existing gram-only caps become quantity + g.
UPDATE "Food"
SET
    "maxPortionQuantity" = "maxPortionGrams",
    "maxPortionUnit" = 'GRAM'
WHERE "maxPortionGrams" IS NOT NULL
  AND "maxPortionQuantity" IS NULL;
