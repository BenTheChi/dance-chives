"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { UserCard } from "@/components/UserCard";

interface UserAvatarProps {
  username: string;
  displayName: string;
  avatar?: string | null;
  image?: string | null;
  className?: string;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
  isSmall?: boolean;
  showHoverCard?: boolean;
  styles?: string[];
  city: string;
  borderColor?: "black" | "white";
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
  isSmall = false,
  showHoverCard = false,
  styles,
  city,
  borderColor = "black",
}: UserAvatarProps) {
  const size = isSmall ? 30 : 45;
  const avatarUrl = avatar;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : username[0]?.toUpperCase() || "U";

  const avatarElement = (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 transition-colors cursor-pointer",
        borderColor === "white" ? "border-white" : "border-black"
      )}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName || username}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-semibold">
          {initials}
        </div>
      )}
    </div>
  );

  const content = showHoverCard ? (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          href={`/profiles/${username}`}
          prefetch={false}
          className="inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {avatarElement}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-auto p-0 bg-fog-white"
        sideOffset={8}
        collisionPadding={16}
      >
        <UserCard
          displayName={displayName}
          username={username}
          image={image || undefined}
          styles={styles}
          city={city}
          isSmall
        />
      </HoverCardContent>
    </HoverCard>
  ) : (
    <Link
      href={`/profiles/${username}`}
      prefetch={false}
      className="block"
      onClick={(e) => e.stopPropagation()}
    >
      {avatarElement}
    </Link>
  );

  return (
    <div
      className={cn(
        "relative inline-block group flex items-center justify-center",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={isRemoving}
          className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {content}
    </div>
  );
}
