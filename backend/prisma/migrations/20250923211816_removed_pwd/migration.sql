/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
ALTER COLUMN "isVerified" DROP NOT NULL,
ALTER COLUMN "isOnline" DROP NOT NULL,
ALTER COLUMN "agreedToTerms" DROP NOT NULL;
