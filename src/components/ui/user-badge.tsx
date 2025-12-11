import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserBadgeProps {
  username: string;
  displayName: string;
  avatar?: string | null;
  image?: string | null;
  className?: string;
  onRemove?: () => void;
}

export function UserBadge({
  username,
  displayName,
  avatar,
  image,
  className,
  onRemove,
}: UserBadgeProps) {
  const badgeClasses = cn(
    "text-black bg-white border border-black font-semibold text-xs px-1 py-1 rounded flex items-center justify-center leading-none gap-1.5",
    className
  );

  const avatarUrl = avatar || image;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : username[0]?.toUpperCase() || "U";

  return (
    <span className={badgeClasses}>
      <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden border border-black">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName || username}
            width={30}
            height={30}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-semibold leading-none">
            {initials}
          </div>
        )}
      </div>
      <span className="text-sm">{displayName}</span>
      <span className="text-gray-600 text-sm">({username})</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5 transition-colors shrink-0"
          aria-label={`Remove ${displayName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
