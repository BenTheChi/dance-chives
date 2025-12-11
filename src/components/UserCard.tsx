import Image from "next/image";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";

interface UserCardProps {
  displayName: string;
  username: string;
  image?: string;
  styles?: string[];
  city: string;
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
      className="flex flex-col items-center border border-black rounded-[5px] h-[425px] w-[250px] hover:shadow-lg/50 transition-shadow justify-between pb-2"
    >
      <div className="flex flex-col items-center my-1 w-full border-b border-black pb-1">
        <span className="text-md font-bold leading-tight">{displayName}</span>
        <span className="text-sm text-gray-500 leading-tight">@{username}</span>
      </div>

      <div className="border-1 border-black my-2 rounded-[5px] w-fit">
        {image ? (
          <div className="relative w-[215px] h-[300px] rounded-[5px]">
            <Image
              src={image}
              alt={displayName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[215px] h-[300px] bg-gray-200 flex items-center justify-center text-lg rounded-[5px]">
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
