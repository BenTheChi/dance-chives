import { ReactNode } from "react";

interface SectionContainerProps {
  children: ReactNode;
  bgColor?: string;
  borderColor?: string;
  padding?: string;
  id?: string;
  className?: string;
}

export function SectionContainer({
  children,
  bgColor = "bg-[#f5f5f5]",
  borderColor = "border-black",
  padding = "py-24 px-4",
  id,
  className = "",
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={`${bgColor} ${padding} border-b-8 ${borderColor} ${className}`}
    >
      {children}
    </section>
  );
}
