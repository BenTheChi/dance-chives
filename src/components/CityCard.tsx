import Link from "next/link";
import { City } from "@/types/city";

interface CityCardProps {
  city: City;
  href?: string;
}

export function CityCard({ city, href }: CityCardProps) {
  const content = (
    <div className="card flex flex-col items-center justify-center w-full max-w-[500px] aspect-square p-6">
      <h2 className="text-center mb-4">{city.name}</h2>
      <div className="flex flex-row gap-2 items-center justify-center flex-wrap">
        {city.region && <h3 className="text-center">{city.region}</h3>}
      </div>
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
