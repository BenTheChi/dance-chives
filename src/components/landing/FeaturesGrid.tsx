import { ReactNode } from "react";

interface FeaturesGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  gap?: string;
}

export function FeaturesGrid({
  children,
  columns = 3,
  gap = "gap-10 md:gap-12",
}: FeaturesGridProps) {
  const gridCols = {
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`max-w-2xl lg:max-w-7xl mx-auto grid ${gridCols[columns]} ${gap}`}
    >
      {children}
    </div>
  );
}
