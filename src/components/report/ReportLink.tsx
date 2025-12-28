"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReportDialog } from "./ReportDialog";

interface ReportLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function ReportLink({ 
  className,
  children = "Report"
}: ReportLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const pathname = usePathname();
  const { data: session } = useSession();

  // Construct full URL from pathname
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const url = `${origin}${pathname}`;
      setCurrentUrl(url);
    }
  }, [pathname]);

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

