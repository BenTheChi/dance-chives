interface SectionHeaderProps {
  title: string;
  subtitle: string;
  titleColor?: string;
  subtitleColor?: string;
}

export function SectionHeader({
  title,
  subtitle,
  titleColor = "text-[#2a2a2a]",
  subtitleColor = "text-[#2a2a2a]",
}: SectionHeaderProps) {
  return (
    <div className="text-center mb-16 md:mb-20">
      <h2
        className={`text-5xl md:text-7xl font-black ${titleColor} mb-4 uppercase tracking-tight`}
      >
        {title}
      </h2>
      <p
        className={`text-2xl md:text-3xl ${subtitleColor} max-w-3xl mx-auto font-bold uppercase`}
      >
        {subtitle}
      </p>
    </div>
  );
}
