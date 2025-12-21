import { cn } from "@/lib/utils";

interface UnderConstructionProps {
  title?: string;
  message?: string;
  className?: string;
}

export function UnderConstruction({
  title = "Under Construction",
  message = "We're working on something amazing! Check back soon.",
  className,
}: UnderConstructionProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] px-4 py-12",
        className
      )}
    >
      <div className="bg-charcoal/20 rounded-sm p-8 md:p-12 border-2 border-black max-w-2xl w-full text-center relative">
        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-black bg-mint rotate-45"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-black bg-pulse-green rotate-45"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-black bg-periwinkle rotate-45"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-black bg-primary rotate-45"></div>

        {/* Main content */}
        <div className="relative z-10">
          <h1 className="!font-rubik-mono-one mb-6">Under Construction</h1>

          <div className="mb-8">
            <span className="text-white font-semibold text-[200px]">🚧</span>
          </div>

          <p className="text-base mb-6">{message}</p>
        </div>
      </div>
    </div>
  );
}
