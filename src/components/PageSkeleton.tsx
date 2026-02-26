"use client";

import Image from "next/image";

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 w-full min-h-[60vh] flex items-center justify-center">
      <Image
        src="/Dancechives_Icon_Color_onDark.svg"
        alt="Loading"
        width={250}
        height={250}
        className="animate-rock"
        priority
      />
    </div>
  );
}
