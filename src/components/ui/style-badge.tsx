import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeStyleName,
  formatStyleNameForDisplay,
} from "@/lib/utils/style-utils";

interface StyleBadgeProps {
  style: string;
  asLink?: boolean;
  className?: string;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

export function StyleBadge({
  style,
  asLink = false,
  className,
  showRemoveButton = false,
  onRemove,
}: StyleBadgeProps) {
  const badgeClasses = cn(
    "text-black bg-fog-white border border-charcoal font-semibold text-xs px-1 py-0.5 rounded inline-flex items-center justify-center leading-none gap-1",
    asLink &&
      !showRemoveButton &&
      "hover:bg-mint/50 click:bg-mint/50 transition-colors cursor-pointer",
    className
  );

  // Normalize for URL, format for display
  const normalizedStyle = normalizeStyleName(style);
  const displayStyle = formatStyleNameForDisplay(style);

  const badgeContent = (
    <>
      {displayStyle}
      {showRemoveButton && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${displayStyle}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </>
  );

  if (asLink && !showRemoveButton) {
    return (
      <Link
        href={`/styles/${encodeURIComponent(normalizedStyle)}`}
        className={badgeClasses}
      >
        {badgeContent}
      </Link>
    );
  }

  return <span className={badgeClasses}>{badgeContent}</span>;
}
