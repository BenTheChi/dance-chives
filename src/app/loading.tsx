"use client";

import { AppNavbar } from "@/components/AppNavbar";
import Image from "next/image";
import { useState } from "react";

export default function Loading() {
  const [imageSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth > 768 ? 500 : 300
  );

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-4 py-20 px-4">
        <Image
          src="/mascot/Mascot3_Color_onDark.svg"
          alt="Loading"
          width={imageSize}
          height={imageSize}
          className="animate-rotate-medium"
        />
      </div>
    </>
  );
}
