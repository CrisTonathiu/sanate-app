-- CreateTable
CREATE TABLE "ProtocolTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "weeklyPlan" JSONB NOT NULL,
    "planCalories" DOUBLE PRECISION,
    "macroPercents" JSONB,
    "enabledMeals" JSONB,
    "mealPercentages" JSONB,
    "macroMealPercentages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProtocolTemplate_createdById_idx" ON "ProtocolTemplate"("createdById");

-- AddForeignKey
ALTER TABLE "ProtocolTemplate" ADD CONSTRAINT "ProtocolTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
