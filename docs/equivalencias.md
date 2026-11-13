# Equivalencias

How the app turns a patient's plan into the **Equivalencias** table in the plan
PDF, and how the patient portal sizes ingredient swaps. Both use the same
rules, so a swap always matches the PDF line for that food.

Code: `src/lib/patient-portal/equivalencias.ts` (PDF table and shared helpers)
and `src/lib/patient-portal/ingredient-swaps.ts` (portal swaps).

## What an equivalent is

An equivalent (*equivalente*, SMAE) is the amount of a food that gives about
the same nutrients as one equivalent of any other food in its group. Each food
in the catalog stores:

- `gramsPerEquivalent`: grams of one equivalent (Pechuga de pollo: 30 g).
- `equivalentDisplayText`: the household measure of one equivalent, when it has
  one (Atún en agua: `1/3 lata`; Pechuga de pavo: `2 rebanadas`).

Foods with no equivalent data are left out of the table. Free foods (verduras,
frutos rojos) are listed without an amount.

## How many equivalents per meal

The PDF groups foods into columns (PROTEINAS, CARBOHIDRATOS, ...). For each
column:

1. Every meal in the protocol counts once: each day's slot across all weeks.
   A recipe eaten five times counts five times.
2. For each meal, add up the equivalents of that column's foods:
   `grams in the meal ÷ gramsPerEquivalent`.
3. Average those totals over the meals that include the column. Meals with no
   food from the column are left out so they don't pull the average down.
4. Round the average with the rule below.

Example: three meals with 99 g, 120 g and 105 g of pollo are 3.3, 4 and 3.5
equivalents. The average is 3.6, which rounds to **3.5 equivalents**.

When there is no plan (no active protocol), each food shows **1 equivalent**.

## Rounding rule

Equivalents round **down** to the whole number or the half below them. The
only exception: when the value is within **0.10 of the next whole number**, it
rounds **up** to that whole number.

| Average | Rounded | Why |
|---|---|---|
| 3.2 | 3 | below the half: down to the whole |
| 3.45 | 3 | below the half: down to the whole |
| 3.5 | 3.5 | exactly a half |
| 3.6 | 3.5 | down to the half |
| 3.75 | 3.5 | down to the half |
| 3.89 | 3.5 | more than 0.10 below 4 |
| 3.9 | 4 | within 0.10 of 4: up |
| 0.2 | 0.5 | never below half an equivalent |

Rounding down keeps portions at or under what the plan calculated; the 0.10
exception avoids dropping almost a full equivalent.

Function: `roundEquivalents` in `equivalencias.ts`.

## What each line shows

Every food in a column gets the **same number of equivalents**, so any line can
replace any other. The amount is that number times the food's single
equivalent:

- With a household measure: the measure is multiplied, keeping fractions exact.
  3.5 equivalents of Atún en agua (`1/3 lata`) = `1 1/6 latas`;
  of Pechuga de pavo (`2 rebanadas`) = `7 rebanadas`.
- Without one: grams. 3.5 equivalents of Pechuga de pollo (30 g) = `105 g`.

**Whole-piece foods** (marked "Porción discreta" without piece fractions, like
huevo) can't be split. Their pieces round with the same rule (down, unless
within 0.10 of the next piece) and never go below one piece. 3.5 equivalents of
Huevo entero (`1 pza`) = `3 pzas`.

Function: `formatEquivalentsMeasure` / `equivalentsForFood`.

## Portal swaps

When a patient swaps an ingredient in a recipe:

1. The original ingredient's grams are converted to equivalents and rounded with
   the same rule (105 g pollo = 3.5 equivalents).
2. Each option gets that many equivalents, shown with the same measure as the
   PDF (`7 rebanadas Pechuga de pavo`, `3 pzas Huevo entero`), plus its grams.
3. Options are limited to similar foods (same swap category, or same group and
   main macro), skip disliked foods and foods above their `maxPortionGrams`,
   and hide options whose calories end up far from the original.

Foods without equivalent data fall back to matching the original's calories.

So a swap for a plan meal shows the same amount as that food's line in the PDF
whenever the meal's portion equals the plan average.
