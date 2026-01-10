-- AddForeignKey
ALTER TABLE "AccountClaimRequest" ADD CONSTRAINT "AccountClaimRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
