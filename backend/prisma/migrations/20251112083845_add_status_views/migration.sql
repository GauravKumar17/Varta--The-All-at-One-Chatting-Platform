-- CreateTable
CREATE TABLE "public"."userStatusView" (
    "id" SERIAL NOT NULL,
    "statusId" INTEGER NOT NULL,
    "viewerId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userStatusView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userStatusView_statusId_viewerId_key" ON "public"."userStatusView"("statusId", "viewerId");

-- CreateIndex
CREATE INDEX "userStatus_userId_idx" ON "public"."userStatus"("userId");

-- AddForeignKey
ALTER TABLE "public"."userStatusView" ADD CONSTRAINT "userStatusView_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."userStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userStatusView" ADD CONSTRAINT "userStatusView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
