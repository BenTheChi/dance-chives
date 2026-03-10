import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { SquareCard } from "@/components/ui/square-card";

interface StyleCardProps {
  style: string;
  href?: string;
}

export function StyleCard({ style, href }: StyleCardProps) {
  const displayStyle = formatStyleNameForDisplay(style);

  return (
    <SquareCard href={href}>
      <h2 className="text-center mb-4">{displayStyle}</h2>
    </SquareCard>
  );
}
