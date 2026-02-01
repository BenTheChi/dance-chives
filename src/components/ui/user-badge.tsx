import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserBadgeProps {
  username: string;
  displayName: string;
  instagram?: string | null;
  claimed?: boolean;
  avatar?: string | null;
  image?: string | null;
  className?: string;
  onRemove?: () => void;
  showAvatar?: boolean;
  showSecondaryLabel?: boolean;
  usernameParentheses?: boolean;
}

export function UserBadge({
  username,
  displayName,
  instagram,
  claimed = true,
  avatar,
  image,
  className,
  onRemove,
  showAvatar,
  showSecondaryLabel,
  usernameParentheses,
}: UserBadgeProps) {
  const badgeClasses = cn(
    "text-black border border-black font-semibold text-xs px-1 py-1 rounded flex items-center justify-center leading-none gap-1.5",
    claimed ? "bg-fog-white" : "bg-neutral-200 italic",
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

  const avatarVisible = showAvatar ?? true;
  const secondaryLabelVisible = showSecondaryLabel ?? true;
  const wrapUsername = usernameParentheses ?? true;

  const showInstagramAsPrimary = !claimed && !!instagram;
  const primaryLabel = showInstagramAsPrimary ? `@${instagram}` : displayName;
  const usernameDisplay = wrapUsername ? `(${username})` : username;
  const secondaryLabel = instagram ? `@${instagram}` : usernameDisplay;
  const showSecondary =
    secondaryLabelVisible && (claimed || !showInstagramAsPrimary);

  return (
    <span className={badgeClasses}>
      {avatarVisible && (
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
      )}
      <span className="text-sm">{primaryLabel}</span>
      {showSecondary && (
        <span className="text-gray-600 text-sm">{secondaryLabel}</span>
      )}
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
