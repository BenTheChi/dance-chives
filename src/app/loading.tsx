"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Loading() {
  const pathname = usePathname();

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-4 py-20 px-4">
        <Image
          src="/mascot/Mascot3_Color_onDark.svg"
          alt="Loading"
          width={screen.width > 768 ? 500 : 300}
          height={screen.width > 768 ? 500 : 300}
          className="animate-rotate-medium"
        />
      </div>
    </>
  );
}
