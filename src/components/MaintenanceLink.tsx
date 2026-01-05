"use client";

import Link from "next/link";
import { isMaintenanceMode } from "@/lib/maintenance";
import { ReactNode } from "react";

interface MaintenanceLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: unknown; // Allow other Link props
}

/**
 * A Link component that disables navigation when maintenance mode is enabled
 * Use this instead of Next.js Link when you want links to be disabled during maintenance
 */
export function MaintenanceLink({
  href,
  children,
  className = "",
  onClick,
  ...props
}: MaintenanceLinkProps) {
  const maintenanceMode = isMaintenanceMode();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (maintenanceMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  return (
    <Link
      href={href}
      className={`${className} ${
        maintenanceMode
          ? "pointer-events-none cursor-not-allowed opacity-50"
          : ""
      }`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
