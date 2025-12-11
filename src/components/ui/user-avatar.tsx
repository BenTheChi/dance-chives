import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  displayName: string;
  avatar?: string | null;
  image?: string | null;
  className?: string;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function UserAvatar({
  username,
  displayName,
  avatar,
  image,
  className,
  showRemoveButton = false,
  onRemove,
  isRemoving = false,
  icon: Icon,
}: UserAvatarProps) {
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
    <div className={cn("relative inline-block group", className)}>
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <Link
        href={`/profiles/${username}`}
        className="hover:opacity-80 transition-opacity block"
      >
        <div className="relative w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-black transition-colors">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || username}
              width={45}
              height={45}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-semibold">
              {initials}
            </div>
          )}
          {Icon && (
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm">
              <Icon className="w-3 h-3" />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
