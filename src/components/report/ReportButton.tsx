"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReportDialog } from "./ReportDialog";

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

