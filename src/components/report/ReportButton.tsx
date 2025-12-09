"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReportDialog } from "./ReportDialog";

export function ReportButton() {
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
    session?.user?.username || session?.user?.displayName || undefined;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
        aria-label="Report content"
      >
        <Flag className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
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

