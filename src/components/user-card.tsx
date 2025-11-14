import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StyleBadge } from "@/components/ui/style-badge";

interface UserCardProps {
  id: string;
  displayName: string;
  username: string;
  image?: string;
  styles?: string[];
}

export function UserCard({
  id,
  displayName,
  username,
  image,
  styles,
}: UserCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-4 sm:p-6">
        <Link href={`/profiles/${username}`}>
          <div className="flex items-start gap-4">
            {image ? (
              <Image
                src={image}
                alt={displayName || username}
                width={60}
                height={60}
                className="rounded-full object-cover border-2"
                unoptimized
              />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                {(displayName || username || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                {displayName || username}
              </h3>
              <p className="text-sm text-muted-foreground">@{username}</p>
              {styles && styles.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {styles.slice(0, 3).map((style) => (
                    <StyleBadge key={style} style={style} asLink={false} />
                  ))}
                  {styles.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{styles.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
