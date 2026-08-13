-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "mixMainMeals" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the singleton row used by get-or-create
INSERT INTO "AppSettings" ("id", "mixMainMeals", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);
