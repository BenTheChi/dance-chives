"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OwnershipApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (addOldCreatorAsTeamMember: boolean) => void;
}

export function OwnershipApprovalDialog({
  open,
  onOpenChange,
  onApprove,
}: OwnershipApprovalDialogProps) {
  const handleYes = () => {
    onApprove(true);
    onOpenChange(false);
  };

  const handleNo = () => {
    onApprove(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Ownership</DialogTitle>
          <DialogDescription>
            You are about to transfer ownership of this event. Would you like
            the previous owner to remain a team member?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleNo}>
            No
          </Button>
          <Button onClick={handleYes}>Yes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
