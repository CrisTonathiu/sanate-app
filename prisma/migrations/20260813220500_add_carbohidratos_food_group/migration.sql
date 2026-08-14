INSERT INTO "FoodGroup" ("id", "name", "isFree")
SELECT 'cmssb5jn700001bkozuqky65w', 'CARBOHIDRATOS', false
WHERE NOT EXISTS (
  SELECT 1 FROM "FoodGroup" WHERE "name" = 'CARBOHIDRATOS'
);
