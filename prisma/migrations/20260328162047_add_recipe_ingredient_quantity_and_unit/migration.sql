-- CreateEnum
CREATE TYPE "IngredientUnit" AS ENUM ('GRAM', 'PIECE', 'CUP', 'TBSP', 'TSP', 'ML', 'OZ');

-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "unit" "IngredientUnit" NOT NULL DEFAULT 'GRAM',
ALTER COLUMN "grams" SET DEFAULT 100;
