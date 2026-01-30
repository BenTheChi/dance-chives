"use client";

import Image from "next/image";

const OVERLAY_IMAGE = "/mascot/Mascot3_Color_onDark.svg";

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 w-full min-h-[60vh] flex items-center justify-center">
      <Image
        src={OVERLAY_IMAGE}
        alt="Loading"
        width={250}
        height={250}
        className="animate-rotate-medium"
        priority
      />
    </div>
  );
}
