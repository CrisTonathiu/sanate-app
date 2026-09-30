-- Keep manual piece fractions (1/3 pz) edited on a protocol meal.
ALTER TABLE "ProtocolMealIngredient" ADD COLUMN "allowPieceFractions" BOOLEAN NOT NULL DEFAULT false;
