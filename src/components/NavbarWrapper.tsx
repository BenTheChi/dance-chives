"use client";

import { usePathname } from "next/navigation";

interface NavbarWrapperProps {
    children: React.ReactNode;
}

export function NavbarWrapper({ children }: NavbarWrapperProps) {
    const pathname = usePathname();

    if (pathname === "/signup") {
        return null;
    }

    return <>{children}</>;
}
