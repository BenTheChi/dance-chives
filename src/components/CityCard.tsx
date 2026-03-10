import { City } from "@/types/city";
import { SquareCard } from "@/components/ui/square-card";

interface CityCardProps {
  city: City;
  href?: string;
}

export function CityCard({ city, href }: CityCardProps) {
  return (
    <SquareCard href={href}>
      <h2 className="text-center mb-4">{city.name}</h2>
      <div className="flex flex-row flex-wrap items-center justify-center gap-2">
        {city.region && <h3 className="text-center">{city.region}</h3>}
      </div>
    </SquareCard>
  );
}
