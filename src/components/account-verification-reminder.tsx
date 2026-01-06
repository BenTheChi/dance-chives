"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const promptMessage =
  "You made your account but you haven't registered with Dance Chives yet! Registration is required in order to tag, create content, and be visible on the site. Would you like to complete sign up now?";

export default function AccountVerificationReminder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const shouldShowDialog =
      status === "authenticated" &&
      Boolean(session?.user) &&
      !session?.user?.accountVerified &&
      !isDismissed;

    setIsOpen(shouldShowDialog);
  }, [
    status,
    session?.user?.accountVerified,
    session?.user?.id,
    isDismissed,
  ]);

  const handleClose = () => {
    setIsOpen(false);
    setIsDismissed(true);
  };

  const handleCompleteSignup = () => {
    setIsOpen(false);
    setIsDismissed(true);
    router.push("/signup");
  };

  if (status === "loading") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete your registration</DialogTitle>
        </DialogHeader>
        <DialogDescription>{promptMessage}</DialogDescription>
        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button onClick={handleCompleteSignup}>Yes, take me to signup</Button>
          <Button variant="outline" onClick={handleClose}>
            No, maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

