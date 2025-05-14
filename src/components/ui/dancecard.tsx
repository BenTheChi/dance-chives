// src/components/DanceCard.tsx
import Image from 'next/image';

interface DanceCardProps {
  title: string;
  subtitle: string;
  date: string;
  location: string;
  badge: string;
  imageUrl: string;
}

export default function DanceCard({
  title,
  subtitle,
  date,
  location,
  badge,
  imageUrl,
}: DanceCardProps) {
  return (
    <div className="flex rounded-xl bg-white shadow-md p-4 w-full max-w-sm gap-4">
      <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={title}
          width={96}
          height={96}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex flex-col justify-between flex-1">
        <div>
          <h2 className="font-bold text-md">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        <div className="text-sm text-gray-700 mt-1">
          <p>{date}</p>
          <p>🇺🇸 {location}</p>
        </div>

        <div className="mt-2">
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-md">
            {badge}
          </span>
        </div>
      </div>
    </div>
  );
}
