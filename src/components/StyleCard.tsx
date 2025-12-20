import Link from "next/link";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

interface StyleCardProps {
  style: string;
  href?: string;
}

export function StyleCard({ style, href }: StyleCardProps) {
  const displayStyle = formatStyleNameForDisplay(style);
  const content = (
    <div className="card flex flex-col items-center justify-center w-full max-w-[500px] aspect-square p-6">
      <h2 className="text-center mb-4">{displayStyle}</h2>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full max-w-[500px]">
        {content}
      </Link>
    );
  }

  return <div className="w-full max-w-[500px]">{content}</div>;
}
