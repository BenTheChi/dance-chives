"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportDialog } from "./ReportDialog";
import { useCurrentUrl } from "@/hooks/useCurrentUrl";

interface ReportButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "md";
}

export function ReportButton({ 
  className, 
  variant = "ghost", 
  size = "icon" 
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUrl = useCurrentUrl();
  const { data: session } = useSession();

  const username =
    session?.user?.username || session?.user?.displayName || session?.user?.name || undefined;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        variant={variant}
        size={size}
        aria-label="Report Issue"
      >
        <Flag className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-primary-dark">
          <DialogTitle className="sr-only">Send Report</DialogTitle>
          <ReportDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            username={username}
            pageReference={currentUrl}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

