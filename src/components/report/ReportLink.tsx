"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportDialog } from "./ReportDialog";
import { useCurrentUrl } from "@/hooks/useCurrentUrl";

interface ReportLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function ReportLink({ 
  className,
  children = "Report"
}: ReportLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentUrl = useCurrentUrl();
  const { data: session } = useSession();

  const username =
    session?.user?.username || session?.user?.displayName || session?.user?.name || undefined;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
        type="button"
        aria-label="Report Issue"
      >
        {children}
      </button>

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


