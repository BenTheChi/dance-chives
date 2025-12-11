import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  normalizeStyleName,
  formatStyleNameForDisplay,
} from "@/lib/utils/style-utils";

interface StyleBadgeProps {
  style: string;
  asLink?: boolean;
  className?: string;
}

export function StyleBadge({
  style,
  asLink = true,
  className,
}: StyleBadgeProps) {
  const badgeClasses = cn(
    "text-black bg-white border border-black font-semibold text-xs px-1 py-0.5 rounded inline-flex items-center justify-center leading-none",
    asLink && "hover:bg-gray-100 transition-colors cursor-pointer",
    className
  );

  // Normalize for URL, format for display
  const normalizedStyle = normalizeStyleName(style);
  const displayStyle = formatStyleNameForDisplay(style);

  if (asLink) {
    return (
      <Link
        href={`/styles/${encodeURIComponent(normalizedStyle)}`}
        className={badgeClasses}
      >
        {displayStyle}
      </Link>
    );
  }

  return <span className={badgeClasses}>{displayStyle}</span>;
}
