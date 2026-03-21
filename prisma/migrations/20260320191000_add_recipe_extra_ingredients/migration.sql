-- CreateTable
CREATE TABLE "RecipeExtraIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeExtraIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeExtraIngredient_recipeId_idx" ON "RecipeExtraIngredient"("recipeId");

-- AddForeignKey
ALTER TABLE "RecipeExtraIngredient" ADD CONSTRAINT "RecipeExtraIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
