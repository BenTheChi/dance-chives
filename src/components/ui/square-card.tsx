import Link from "next/link";
import { cn } from "@/lib/utils";

interface SquareCardProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
}

export function SquareCard({ children, href, className }: SquareCardProps) {
  const inner = (
    <div
      className={cn(
        "card flex flex-col items-center justify-center w-full max-w-[500px] aspect-square p-6",
        className
      )}
    >
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full max-w-[500px]">
        {inner}
      </Link>
    );
  }

  return <div className="w-full max-w-[500px]">{inner}</div>;
}
