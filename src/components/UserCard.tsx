import Image from "next/image";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";

interface UserCardProps {
  displayName: string;
  username: string;
  image?: string;
  styles?: string[];
  city: string;
  isSmall?: boolean;
}

export function UserCard({
  displayName,
  username,
  image,
  styles,
  city,
}: UserCardProps) {
  return (
    <Link
      href={`/profiles/${username}`}
      className="card flex flex-col items-center w-[250px] justify-between pb-2 bg-periwinkle-light"
    >
      <div className="flex flex-col text-center py-3 w-full border-b border-black bg-misty-seafoam">
        <h2>{displayName}</h2>
      </div>

      <div className="border-1 border-black my-2 rounded-sm w-fit">
        {image ? (
          <div className="relative w-[215px] h-[300px] rounded-sm">
            <Image
              src={image}
              alt={displayName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[215px] h-[300px] bg-gray-200 px-2 flex items-center justify-center text-center text-lg rounded-sm">
            {displayName}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        {styles && styles.length > 0 && (
          <>
            <StyleBadge key={styles[0]} style={styles[0]} asLink={false} />
            {styles.length > 1 && (
              <span className="text-sm text-gray-500">
                +{styles.length - 1}
              </span>
            )}
          </>
        )}
      </div>
      <span className="text-sm text-gray-500">{city}</span>
    </Link>
  );
}
