-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('PRINCIPIANTE', 'AVANZADO');

-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "category" TYPE "ExerciseCategory" USING ("category"::"ExerciseCategory");
