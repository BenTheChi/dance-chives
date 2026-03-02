import Image from "next/image";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { normalizeStyleNames } from "@/lib/utils/style-utils";

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
  const canonicalStyles = normalizeStyleNames(styles || [], {
    strict: false,
  });

  return (
    <Link
      href={`/profiles/${username}`}
      prefetch={false}
      className="card flex flex-col items-center w-[250px] justify-between pb-2 bg-secondary-dark"
    >
      <div className="flex flex-col text-center py-3 w-full border-b-4 border-primary-light bg-primary-dark">
        <h2 className="text-white">{displayName}</h2>
      </div>

      <div className="my-2 rounded-sm w-fit">
        {image ? (
          <div className="relative w-[215px] h-[300px] rounded-sm border-3 border-charcoal">
            <Image
              src={image}
              alt={displayName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-[215px] h-[300px] bg-neutral-400 rounded-sm overflow-hidden border-3 border-charcoal">
            <Image
              src="/mascot/Default_Mascot2_Mono_onLight.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        {canonicalStyles.length > 0 && (
          <>
            <StyleBadge
              key={canonicalStyles[0]}
              style={canonicalStyles[0]}
              asLink={false}
            />
            {canonicalStyles.length > 1 && (
              <span className="text-sm">+{canonicalStyles.length - 1}</span>
            )}
          </>
        )}
      </div>
      <span className="text-sm">{city}</span>
    </Link>
  );
}
