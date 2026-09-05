-- Distinguish whole pieces (tortilla, bread) from fractionable pieces (avocado).
ALTER TABLE "Food" ADD COLUMN "allowPieceFractions" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Food"
SET "allowPieceFractions" = true
WHERE "isDiscrete" = true
  AND (
    lower("name") LIKE '%aguacate%'
    OR (
      "maxPortionUnit" = 'PIECE'
      AND "maxPortionQuantity" IS NOT NULL
      AND "maxPortionQuantity" <> TRUNC("maxPortionQuantity")
    )
    OR (
      "minPortionUnit" = 'PIECE'
      AND "minPortionQuantity" IS NOT NULL
      AND "minPortionQuantity" <> TRUNC("minPortionQuantity")
    )
  );
