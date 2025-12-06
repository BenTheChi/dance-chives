interface FeatureCardProps {
  title: string;
  description: string;
  cardBgColor?: string;
  cardBorderColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  previewPlaceholder?: string;
}

export function FeatureCard({
  title,
  description,
  cardBgColor = "bg-[#f5f5f5]",
  cardBorderColor = "border-black",
  headerBgColor = "bg-[#3a3a3a]",
  headerTextColor = "text-[#c4ffd9]",
  previewPlaceholder = "Feature preview coming soon!",
}: FeatureCardProps) {
  return (
    <div
      className={`${cardBgColor} border-8 ${cardBorderColor} overflow-hidden`}
    >
      <div
        className={`p-8 h-32 flex items-center justify-center ${headerBgColor}`}
      >
        <h3
          className={`text-xl font-black ${headerTextColor} text-center uppercase`}
        >
          {title}
        </h3>
      </div>
      <div
        className={`relative h-72 ${cardBgColor} border-t-4 ${cardBorderColor}`}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center bg-[#3a3a3a] text-[#f5f5f5] border-4 border-black m-4`}
        >
          <p className="text-md md:text-lg text-center font-bold uppercase">
            {previewPlaceholder}
          </p>
        </div>
      </div>
      <div className={`p-8 ${cardBgColor}`}>
        <p className="text-lg text-[#2a2a2a] leading-relaxed font-bold">
          {description}
        </p>
      </div>
    </div>
  );
}
