import { ReactNode } from "react";

interface HeroSectionProps {
  backgroundImage: string;
  title: ReactNode;
  subtitle?: string;
  overlayOpacity?: number;
  height?: string;
  backLink?: {
    href: string;
    label: string;
  };
}

export function HeroSection({
  backgroundImage,
  title,
  subtitle,
  overlayOpacity = 40,
  height = "h-[500px]",
  backLink,
}: HeroSectionProps) {
  return (
    <section
      className={`relative w-full ${height} bg-cover bg-center flex flex-col items-center justify-center border-b-8 border-black`}
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div
        className="absolute inset-0 bg-[#3a3a3a]"
        style={{ opacity: overlayOpacity / 100 }}
      />

      {backLink && (
        <a
          href={backLink.href}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-20 bg-[#c4ffd9] text-[#2a2a2a] px-3 py-1.5 md:px-6 md:py-3 text-sm md:text-xl font-black uppercase border-4 border-black hover:bg-[#3a3a3a] hover:text-[#c4ffd9] transition-all duration-75 flex items-center gap-1.5 md:gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 md:h-6 md:w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {backLink.label}
        </a>
      )}

      <div className="relative z-10 w-full px-4 max-w-5xl flex flex-col items-center">
        <div className="text-center w-full">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-6 uppercase leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-2xl text-white font-bold uppercase tracking-wide mt-3 md:mt-6">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
