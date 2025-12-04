import Image from "next/image";
import Link from "next/link";

interface FeatureLinkCardProps {
  name: string;
  image: string;
  anchor: string;
}

export function FeatureLinkCard({ name, image, anchor }: FeatureLinkCardProps) {
  return (
    <Link
      href={`/features#${anchor}`}
      className="group relative h-[300px] overflow-hidden border-8 border-black bg-[#f5f5f5]"
    >
      <Image src={image} alt={name} fill className="object-cover" />
      <div className="absolute inset-0 bg-[#3a3a3a]/50 flex items-center justify-center border-4 border-black">
        <h3 className="text-[#f5f5f5] text-4xl font-black uppercase tracking-tight group-hover:text-5xl transition-all duration-75">
          {name}
        </h3>
      </div>
    </Link>
  );
}
