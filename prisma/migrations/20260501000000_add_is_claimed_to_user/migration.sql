-- Add invite claim tracking to users
ALTER TABLE "User"
ADD COLUMN "isClaimed" boolean NOT NULL DEFAULT false;
